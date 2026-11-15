from fastapi.testclient import TestClient
from app.main import app

PATH = '/api/v1/demo/operational-event'


def test_demo_event_is_not_measurement_or_eva_clearance():
    with TestClient(app) as client:
        event = client.get(PATH).json()
        assert event['id'] == 'DEMO-EVT-001'
        assert event['activity'] == 'EVA-01'
        assert event['provenance'] == 'SIMULATED'
        assert event['source'] == 'DEMO-SOLAR-01'
        assert event['scenario_at'].startswith('2026-11-15T12:00:00')
        assert event['status'] == 'REVIEW_PENDING'
        assert event['missing_data'] == ['PERSONAL_DOSIMETER_READING']
        assert event['acknowledged_at'] is None
        assert client.get('/api/v1/measurements').json() == []


def test_record_is_shared_and_persists_without_clearing_review_or_missing_data():
    with TestClient(app) as web:
        event = web.get(PATH).json()
        response = web.post(PATH + '/acknowledge', json={
            'expected_revision': event['revision'], 'context_reviewed': True, 'availability_checked': True,
        })
        assert response.status_code == 200
        recorded = response.json()
        assert recorded['acknowledged_at'] is not None
        assert recorded['status'] == 'REVIEW_PENDING'
        assert recorded['missing_data'] == ['PERSONAL_DOSIMETER_READING']
    # Another app / API lifespan reads the same persisted record.
    with TestClient(app) as wearable:
        assert wearable.get(PATH).json() == recorded


def test_availability_change_resets_check_and_rejects_stale_acknowledgement():
    with TestClient(app) as client:
        event = client.get(PATH).json()
        changed = client.post(PATH + '/scenario', json={
            'expected_revision': event['revision'], 'personal_reading_available': True,
        })
        assert changed.status_code == 200
        assert changed.json()['missing_data'] == []
        assert changed.json()['status'] == 'REVIEW_PENDING'
        stale = client.post(PATH + '/acknowledge', json={
            'expected_revision': event['revision'], 'context_reviewed': True, 'availability_checked': True,
        })
        assert stale.status_code == 409
        record = client.post(PATH + '/acknowledge', json={
            'expected_revision': changed.json()['revision'], 'context_reviewed': True, 'availability_checked': True,
        }).json()
        reset = client.post(PATH + '/scenario', json={
            'expected_revision': record['revision'], 'personal_reading_available': False,
        }).json()
        assert reset['acknowledged_at'] is None
        assert reset['missing_data'] == ['PERSONAL_DOSIMETER_READING']
        assert client.get('/api/v1/measurements').json() == []


def test_acknowledgement_requires_both_checks():
    with TestClient(app) as client:
        event = client.get(PATH).json()
        for fields in ({}, {'context_reviewed': False, 'availability_checked': True}):
            response = client.post(PATH + '/acknowledge', json={'expected_revision': event['revision'], **fields})
            assert response.status_code == 422
        assert client.get(PATH).json()['acknowledged_at'] is None


def test_personal_evidence_endpoint_reassesses_the_shared_event_without_touching_observed_records():
    with TestClient(app) as client:
        before = client.get(PATH).json()
        response = client.post(PATH + '/personal-measurement', json={'expected_revision': before['revision']})
        assert response.status_code == 200
        event = response.json()
        assert event['id'] == before['id']
        assert event['assessment']['personal_check']['state'] == 'USABLE'
        assert event['assessment']['next_action'] == 'REVIEW_SOLAR_EVENT'
        assert event['evidence']['personal_measurement']['astronaut_id'] == 'maya'
        assert event['evidence']['personal_measurement']['provenance'] == 'SIMULATED'
        assert client.get('/api/v1/measurements').json() == []
        assert client.post(PATH + '/personal-measurement', json={'expected_revision': before['revision']}).status_code == 409
        observed = {**event['evidence']['personal_measurement'], 'provenance': 'OBSERVED'}
        assert client.post(PATH + '/personal-measurement', json={'expected_revision': event['revision'], 'measurement': observed}).status_code == 422
