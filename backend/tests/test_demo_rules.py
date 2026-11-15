"""Deterministic workflow/persistence checks that do not require an ASGI event loop."""
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.db import get_demo_event, get_measurements, init_db, update_demo_event
from app.operational import SCENARIO_IDS, ScenarioInputs, build_scenario, assess_preparation
from app.main import (
    DemoAcknowledgement, DemoScenarioUpdate, acknowledge_demo_event,
    change_demo_scenario, demo_operational_event,
)


def test_fixture_is_reproducible_and_separate_from_measurements():
    init_db()
    event = demo_operational_event()
    assert event == demo_operational_event()
    assert event.source == 'DEMO-SOLAR-01'
    assert event.provenance == 'SIMULATED'
    assert event.status == 'REVIEW_PENDING'
    assert event.missing_data == ['PERSONAL_DOSIMETER_READING']
    assert get_measurements() == []


def test_record_persists_without_filling_readings_or_authorizing_eva():
    init_db()
    recorded = acknowledge_demo_event(DemoAcknowledgement(
        expected_revision=1, context_reviewed=True, availability_checked=True,
    ))
    init_db()  # API restart must not reset the shared event.
    assert demo_operational_event() == recorded
    assert recorded.acknowledged_at is not None
    assert recorded.status == 'REVIEW_PENDING'
    assert recorded.missing_data == ['PERSONAL_DOSIMETER_READING']
    assert get_measurements() == []


def test_scenario_change_invalidates_check_and_rejects_stale_revision():
    init_db()
    recorded = acknowledge_demo_event(DemoAcknowledgement(
        expected_revision=1, context_reviewed=True, availability_checked=True,
    ))
    changed = change_demo_scenario(DemoScenarioUpdate(
        expected_revision=recorded.revision, personal_reading_available=True,
    ))
    assert changed.acknowledged_at is None
    assert changed.missing_data == []
    assert changed.status == 'REVIEW_PENDING'
    with pytest.raises(HTTPException) as error:
        acknowledge_demo_event(DemoAcknowledgement(
            expected_revision=recorded.revision, context_reviewed=True, availability_checked=True,
        ))
    assert error.value.status_code == 409
    assert get_measurements() == []


def test_concurrent_updates_only_accept_one_check_for_the_same_revision():
    init_db()
    def record(_):
        return update_demo_event(1, acknowledged_at='2026-11-15T12:00:00+00:00')
    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(record, range(2))) == [False, True]
    assert get_demo_event()['revision'] == 2


def test_invalid_or_incomplete_check_is_rejected_by_contract():
    for payload in (
        {'expected_revision': 1},
        {'expected_revision': 1, 'context_reviewed': False, 'availability_checked': True},
        {'expected_revision': 0, 'context_reviewed': True, 'availability_checked': True},
    ):
        with pytest.raises(ValidationError):
            DemoAcknowledgement(**payload)


@pytest.mark.parametrize('scenario,state,action,steps', [
    ('missing_personal', 'INCOMPLETE', 'CHECK_PERSONAL', ['AVAILABLE', 'ATTENTION', 'MISSING']),
    ('solar_review', 'ATTENTION', 'REVIEW_SOLAR_EVENT', ['AVAILABLE', 'ATTENTION', 'AVAILABLE']),
    ('complete', 'AVAILABLE', 'RECORD_REVIEW', ['AVAILABLE', 'AVAILABLE', 'AVAILABLE']),
    ('missing_environment', 'INCOMPLETE', 'CHECK_ENVIRONMENT', ['AVAILABLE', 'MISSING', 'AVAILABLE']),
    ('missing_context', 'INCOMPLETE', 'CONFIRM_ACTIVITY', ['MISSING', 'MISSING', 'ATTENTION']),
    ('stale_personal', 'INCOMPLETE', 'REFRESH_PERSONAL', ['AVAILABLE', 'AVAILABLE', 'ATTENTION']),
    ('wrong_personal', 'INCOMPLETE', 'CHECK_ASSOCIATION', ['AVAILABLE', 'AVAILABLE', 'ATTENTION']),
    ('quality_review', 'INCOMPLETE', 'CHECK_QUALITY', ['AVAILABLE', 'AVAILABLE', 'ATTENTION']),
])
def test_assessment_is_derived_from_activity_and_available_information(scenario, state, action, steps):
    result = assess_preparation(build_scenario(scenario), False)
    assert result.data_state == state
    assert result.next_action == action
    assert [step.state for step in result.steps] == steps
    assert result.available_count == int(result.steps[0].state == 'AVAILABLE') + int(result.environment_check.state == 'USABLE') + int(result.personal_check.state == 'USABLE')
    assert result.review_state == 'PENDING'
    assert result.requires_attention is True


@pytest.mark.parametrize('scenario', SCENARIO_IDS)
def test_recording_never_changes_data_availability_or_erases_a_remote_event(scenario):
    before = assess_preparation(build_scenario(scenario), False)
    after = assess_preparation(build_scenario(scenario), True)
    assert before.steps == after.steps
    assert before.data_state == after.data_state
    assert after.review_state == 'RECORDED'
    assert after.requires_attention is (scenario != 'complete')
    assert after.next_action == ('NONE' if scenario == 'complete' else 'FOLLOW_UP' if scenario == 'solar_review' else before.next_action)


def test_complete_scenario_records_consultation_without_eva_clearance():
    init_db()
    changed = change_demo_scenario(DemoScenarioUpdate(expected_revision=1, scenario_id='complete'))
    assert changed.assessment.data_state == 'AVAILABLE'
    assert changed.status == 'REVIEW_PENDING'
    recorded = acknowledge_demo_event(DemoAcknowledgement(
        expected_revision=changed.revision, context_reviewed=True, availability_checked=True,
    ))
    assert recorded.status == 'REVIEW_RECORDED'
    assert recorded.assessment.next_action == 'NONE'
    assert recorded.assessment.requires_attention is False
    assert 'eva_authorized' not in recorded.model_dump()
    assert get_measurements() == []


def test_additive_migration_preserves_scenario_but_invalidates_a_consultation_without_evidence():
    import sqlite3
    from app.db import database_path
    with sqlite3.connect(database_path()) as connection:
        connection.execute('CREATE TABLE demo_operational_event (id TEXT PRIMARY KEY, personal_reading_available INTEGER, acknowledged_at TEXT, revision INTEGER)')
        connection.execute("INSERT INTO demo_operational_event VALUES ('DEMO-EVT-001', 1, '2026-11-15T12:01:00+00:00', 7)")
    init_db()
    init_db()  # Idempotent, including an existing V0.8 database.
    event = demo_operational_event()
    assert event.scenario_id == 'solar_review'
    assert event.revision == 8
    assert event.acknowledged_at is None
    assert event.assessment.data_state == 'ATTENTION'
    assert event.assessment.review_state == 'PENDING'
    assert event.status == 'REVIEW_PENDING'


def test_scenario_contract_rejects_ambiguous_or_unknown_variants():
    for payload in ({}, {'scenario_id': 'unknown'}, {'scenario_id': 'complete', 'personal_reading_available': False}):
        with pytest.raises(ValidationError):
            DemoScenarioUpdate(expected_revision=1, **payload)


def test_shared_browser_fixtures_match_server_assessment_without_a_second_rule_engine():
    import json
    from pathlib import Path
    fixture_path = Path(__file__).resolve().parents[2] / 'shared/testing/operational-events.json'
    for key, event in json.loads(fixture_path.read_text(encoding='utf-8')).items():
        assessment = assess_preparation(ScenarioInputs.model_validate(event['evidence']), event['acknowledged_at'] is not None)
        assert event['assessment'] == assessment.model_dump()
