from datetime import timedelta
import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from app import operational as op
from app.db import init_db, get_demo_event, update_demo_event, get_measurements
from app.main import (DemoMeasurementUpdate, DemoAcknowledgement, receive_demo_measurement, demo_operational_event, acknowledge_demo_event)


def test_missing_reading_is_resolved_by_actual_evidence_without_switching_scenario_or_erasing_solar_event():
    init_db()
    before = demo_operational_event()
    acknowledged = acknowledge_demo_event(DemoAcknowledgement(expected_revision=before.revision, context_reviewed=True, availability_checked=True))
    assert acknowledged.assessment.personal_check.state == 'MISSING'
    received = receive_demo_measurement(DemoMeasurementUpdate(expected_revision=acknowledged.revision))
    assert received.id == before.id
    assert received.scenario_id == before.scenario_id
    assert received.revision == acknowledged.revision + 1
    assert received.evidence.personal_measurement.astronaut_id == 'maya'
    assert received.evidence.personal_measurement.activity_id == 'EVA-01'
    assert received.evidence.personal_measurement.provenance == 'SIMULATED'
    assert received.assessment.personal_check.state == 'USABLE'
    assert received.assessment.data_state == 'ATTENTION'
    assert received.assessment.radiological_state == 'REMOTE_EVENT_REVIEW'
    assert received.assessment.next_action == 'REVIEW_SOLAR_EVENT'
    assert received.acknowledged_at is None
    assert received.reading_received_at is not None
    init_db()
    assert demo_operational_event() == received
    assert get_measurements() == []


@pytest.mark.parametrize('field,value,issue', [
    ('astronaut_id', 'alex', 'WRONG_ASTRONAUT'), ('activity_id', 'EVA-02', 'WRONG_ACTIVITY'),
    ('mission', 'OTHER', 'WRONG_MISSION'), ('location', 'OTHER', 'WRONG_LOCATION'),
    ('unit', 'µGy/h', 'UNSUPPORTED_UNIT'), ('quantity', 'particle_flux', 'UNSUPPORTED_QUANTITY'),
    ('scope', 'ENVIRONMENTAL', 'WRONG_SCOPE'), ('provenance', 'OBSERVED', 'WRONG_PROVENANCE'),
])
def test_content_and_association_drive_compatibility(field, value, issue):
    context = op.build_scenario('complete')
    context.personal_measurement = context.personal_measurement.model_copy(update={field: value})
    result = op.assess_preparation(context, False)
    assert result.personal_check.state == 'INCOMPATIBLE'
    assert issue in result.personal_check.issues
    assert result.data_state == 'INCOMPLETE'
    assert result.next_action == 'CHECK_ASSOCIATION'


def test_time_quality_and_freshness_are_engineering_checks_not_dose_thresholds(monkeypatch):
    context = op.build_scenario('complete')
    context.personal_measurement.measured_at = op.current_time() + timedelta(seconds=1)
    assert op.assess_preparation(context, False).personal_check.issues == ['FUTURE_READING']
    context.personal_measurement.measured_at = op.current_time() - timedelta(seconds=121)
    monkeypatch.setenv('MUSTACH_DEMO_MAX_READING_AGE_SECONDS', '120')
    assert op.assess_preparation(context, False).personal_check.state == 'STALE'
    context.personal_measurement.measured_at = op.current_time()
    context.personal_measurement.quality = 'UNKNOWN'
    assert op.assess_preparation(context, False).next_action == 'CHECK_QUALITY'
    context.personal_measurement.quality = 'VALID'
    context.personal_measurement.value = 1000000
    assert op.assess_preparation(context, False).personal_check.state == 'USABLE'  # No invented safety limit.


def test_expiry_invalidates_consultation_once_and_rejects_old_revision(monkeypatch):
    init_db()
    initial = demo_operational_event()
    reading = op.personal_fixture(initial.evidence.activity, op.current_time() - timedelta(minutes=14))
    received = receive_demo_measurement(DemoMeasurementUpdate(expected_revision=initial.revision, measurement=reading))
    recorded = acknowledge_demo_event(DemoAcknowledgement(expected_revision=received.revision, context_reviewed=True, availability_checked=True))
    future = op.current_time() + timedelta(minutes=2)
    monkeypatch.setattr(op, 'current_time', lambda: future)
    expired = demo_operational_event()
    assert expired.assessment.personal_check.state == 'STALE'
    assert expired.assessment.next_action == 'REFRESH_PERSONAL'
    assert expired.acknowledged_at is None
    assert expired.revision == recorded.revision + 1
    assert demo_operational_event().revision == expired.revision
    with pytest.raises(HTTPException) as error:
        acknowledge_demo_event(DemoAcknowledgement(expected_revision=recorded.revision, context_reviewed=True, availability_checked=True))
    assert error.value.status_code == 409


def test_observed_and_forecast_payloads_cannot_enter_simulation():
    reading = op.build_scenario('complete').personal_measurement
    for provenance in ('OBSERVED', 'FORECAST'):
        with pytest.raises(ValidationError):
            DemoMeasurementUpdate(expected_revision=1, measurement=reading.model_copy(update={'provenance': provenance}))


def test_incompatible_measurement_can_be_received_and_explained_without_being_marked_sufficient():
    init_db()
    before = demo_operational_event()
    wrong = op.personal_fixture(before.evidence.activity, op.current_time()).model_copy(update={'astronaut_id': 'alex'})
    after = receive_demo_measurement(DemoMeasurementUpdate(expected_revision=before.revision, measurement=wrong))
    assert after.evidence.personal_measurement.astronaut_id == 'alex'
    assert after.personal_reading_available is False
    assert after.assessment.next_action == 'CHECK_ASSOCIATION'
    with pytest.raises(HTTPException):
        receive_demo_measurement(DemoMeasurementUpdate(expected_revision=before.revision))


def test_missing_activity_does_not_generate_a_falsely_associated_reading():
    init_db()
    update_demo_event(get_demo_event()['revision'], scenario_id='missing_context')
    with pytest.raises(HTTPException) as error:
        receive_demo_measurement(DemoMeasurementUpdate(expected_revision=get_demo_event()['revision']))
    assert error.value.status_code == 409
