from fastapi.testclient import TestClient
from app.main import app


def test_health():
    with TestClient(app) as client:
        response = client.get('/health')
        assert response.status_code == 200
        assert response.json()['prototype'] is True


def test_measurements_empty():
    with TestClient(app) as client:
        response = client.get('/api/v1/measurements')
        assert response.status_code == 200
        assert response.json() == []


def test_source_provenance():
    with TestClient(app) as client:
        response = client.get('/api/v1/sources')
        assert response.status_code == 200
        assert all(source['connected'] is False for source in response.json())


def test_limit_validation():
    with TestClient(app) as client:
        assert client.get('/api/v1/measurements?limit=0').status_code == 422


def test_wearable_status_is_unpaired_without_fake_vitals():
    with TestClient(app) as client:
        response = client.get('/api/v1/wearable/status')
        assert response.status_code == 200
        payload = response.json()
        assert payload['paired'] is False
        assert payload['health_status'] == 'not_evaluated'
        assert payload['heart_rate_bpm'] is None
        assert payload['accumulated_dose_msv'] is None
        assert payload['solar_status'] == 'no_forecast'
        assert payload['last_solar_update'] is None


def test_solar_forecast_has_no_invented_values():
    with TestClient(app) as client:
        response = client.get('/api/v1/solar/forecast')
        assert response.status_code == 200
        assert response.json() == {'status': 'no_forecast', 'models': []}


def test_wearable_origin_is_allowed():
    with TestClient(app) as client:
        response = client.options(
            '/api/v1/solar/forecast',
            headers={'Origin': 'http://localhost:5174', 'Access-Control-Request-Method': 'GET'},
        )
        assert response.status_code == 200
        assert response.headers['access-control-allow-origin'] == 'http://localhost:5174'
