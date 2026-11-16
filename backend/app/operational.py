"""Deterministic checks of radiological evidence, never health or EVA clearance."""
import os
from datetime import datetime, timedelta, timezone
from typing import Literal
from pydantic import AwareDatetime, BaseModel, Field
from .measurements import Measurement

ScenarioId = Literal['missing_personal', 'solar_review', 'complete', 'missing_environment', 'missing_context', 'stale_personal', 'wrong_personal', 'quality_review']
# Engineering freshness policy for the prototype; not a NASA medical requirement.
def current_time() -> datetime:
    return datetime.now(timezone.utc)


def max_reading_age_seconds() -> int:
    return max(1, int(os.getenv('MUSTACH_DEMO_MAX_READING_AGE_SECONDS', '900')))


class ActivityContext(BaseModel):
    id: str = 'EVA-01'
    astronaut_id: str = 'maya'
    astronaut_name: str = 'Maya Bennett'
    mission: str = 'HORIZON-01'
    location: str = 'DEMO-EVA-ZONE'
    phase: Literal['PREPARATION'] = 'PREPARATION'
    scheduled_at: AwareDatetime


class RemoteEvent(BaseModel):
    id: str = 'DEMO-SOLAR-01'
    source: str = 'RADIANCE SYNTHETIC EVENT'
    provenance: Literal['SIMULATED'] = 'SIMULATED'
    activity_id: str = 'EVA-01'
    issued_at: AwareDatetime


class ScenarioInputs(BaseModel):
    scenario_at: AwareDatetime
    activity: ActivityContext | None
    environment_measurement: Measurement | None
    personal_measurement: Measurement | None
    solar_event: RemoteEvent | None


SCENARIO_IDS = ('missing_personal', 'solar_review', 'complete', 'missing_environment', 'missing_context', 'stale_personal', 'wrong_personal', 'quality_review')


def personal_fixture(activity: ActivityContext, at: datetime) -> Measurement:
    return Measurement(id='DEMO-PERSONAL-001', source='RADIANCE SYNTHETIC DOSIMETER', provenance='SIMULATED',
        instrument='DEMO-PD-01', measured_at=at, quantity='dose_equivalent_rate', value=0.47, unit='µSv/h',
        mission=activity.mission, scope='PERSONAL', astronaut_id=activity.astronaut_id,
        activity_id=activity.id, location=activity.location, quality='VALID')


def build_scenario(scenario_id: ScenarioId, at: datetime | None = None) -> ScenarioInputs:
    at = at or current_time()
    activity = ActivityContext(scheduled_at=at + timedelta(hours=2))
    personal = personal_fixture(activity, at - timedelta(minutes=2))
    environment = personal.model_copy(update={'id': 'DEMO-ENV-001', 'source': 'RADIANCE SYNTHETIC ENVIRONMENT',
        'instrument': 'DEMO-ENV-01', 'scope': 'ENVIRONMENTAL', 'astronaut_id': None, 'value': 0.43})
    if scenario_id == 'missing_personal':
        personal = None
    elif scenario_id == 'stale_personal':
        personal = personal.model_copy(update={'measured_at': at - timedelta(seconds=max_reading_age_seconds() + 60)})
    elif scenario_id == 'wrong_personal':
        personal = personal.model_copy(update={'astronaut_id': 'alex'})
    elif scenario_id == 'quality_review':
        personal = personal.model_copy(update={'quality': 'REVIEW_REQUIRED'})
    return ScenarioInputs(scenario_at=at, activity=None if scenario_id == 'missing_context' else activity,
        environment_measurement=None if scenario_id in ('missing_environment', 'missing_context') else environment,
        personal_measurement=personal,
        solar_event=RemoteEvent(issued_at=at) if scenario_id in ('missing_personal', 'solar_review') else None)


CheckIssue = Literal['NO_READING', 'NO_ACTIVITY', 'WRONG_SCOPE', 'WRONG_ASTRONAUT', 'WRONG_ACTIVITY', 'WRONG_MISSION', 'WRONG_LOCATION', 'WRONG_PROVENANCE', 'UNSUPPORTED_QUANTITY', 'UNSUPPORTED_UNIT', 'FUTURE_READING', 'READING_TOO_OLD', 'QUALITY_REVIEW']


class MeasurementCheck(BaseModel):
    state: Literal['USABLE', 'MISSING', 'STALE', 'INCOMPATIBLE', 'REVIEW_REQUIRED']
    issues: list[CheckIssue] = Field(default_factory=list)
    measurement_id: str | None = None
    age_seconds: float | None = None
    max_age_seconds: int


def check_measurement(reading: Measurement | None, activity: ActivityContext | None, scope: str, at: datetime) -> MeasurementCheck:
    limit = max_reading_age_seconds()
    if reading is None:
        return MeasurementCheck(state='MISSING', issues=['NO_READING'], max_age_seconds=limit)
    issues: list[CheckIssue] = []
    if activity is None:
        issues.append('NO_ACTIVITY')
    else:
        for actual, expected, reason in ((reading.activity_id, activity.id, 'WRONG_ACTIVITY'),
            (reading.mission, activity.mission, 'WRONG_MISSION'), (reading.location, activity.location, 'WRONG_LOCATION')):
            if actual != expected:
                issues.append(reason)
        if scope == 'PERSONAL' and reading.astronaut_id != activity.astronaut_id:
            issues.append('WRONG_ASTRONAUT')
    if reading.scope != scope:
        issues.append('WRONG_SCOPE')
    if reading.provenance != 'SIMULATED':
        issues.append('WRONG_PROVENANCE')
    if reading.quantity != 'dose_equivalent_rate':
        issues.append('UNSUPPORTED_QUANTITY')
    if reading.unit not in ('µSv/h', 'μSv/h', 'uSv/h', 'mSv/h'):
        issues.append('UNSUPPORTED_UNIT')
    age = (at - reading.measured_at).total_seconds()
    if age < 0:
        issues.append('FUTURE_READING')
    incompatible = bool(issues)
    if age > limit:
        issues.append('READING_TOO_OLD')
    if reading.quality != 'VALID':
        issues.append('QUALITY_REVIEW')
    state = 'INCOMPATIBLE' if incompatible else 'STALE' if age > limit else 'REVIEW_REQUIRED' if reading.quality != 'VALID' else 'USABLE'
    return MeasurementCheck(state=state, issues=issues, measurement_id=reading.id, age_seconds=age, max_age_seconds=limit)


class PreparationStep(BaseModel):
    id: Literal['context', 'radiological', 'personal']
    state: Literal['AVAILABLE', 'ATTENTION', 'MISSING']
    reason: Literal['ACTIVITY_SCHEDULED', 'ACTIVITY_MISSING', 'SOLAR_EVENT', 'ENVIRONMENT_CONTEXT_MISSING', 'ENVIRONMENT_UNUSABLE', 'RADIOLOGICAL_DATA_AVAILABLE', 'PERSONAL_AVAILABLE', 'PERSONAL_MISSING', 'PERSONAL_STALE', 'PERSONAL_INCOMPATIBLE', 'PERSONAL_QUALITY_REVIEW']


class OperationalAssessment(BaseModel):
    data_state: Literal['INCOMPLETE', 'ATTENTION', 'AVAILABLE']
    radiological_state: Literal['INDIVIDUAL_READING_AVAILABLE', 'INDIVIDUAL_READING_UNUSABLE', 'REMOTE_EVENT_REVIEW']
    review_state: Literal['PENDING', 'RECORDED']
    requires_attention: bool
    next_action: Literal['CONFIRM_ACTIVITY', 'CHECK_ENVIRONMENT', 'CHECK_PERSONAL', 'REFRESH_PERSONAL', 'CHECK_ASSOCIATION', 'CHECK_QUALITY', 'REVIEW_SOLAR_EVENT', 'RECORD_REVIEW', 'FOLLOW_UP', 'NONE']
    available_count: int
    personal_check: MeasurementCheck
    environment_check: MeasurementCheck
    steps: list[PreparationStep]


def assess_preparation(inputs: ScenarioInputs, acknowledged: bool, at: datetime | None = None) -> OperationalAssessment:
    at = at or current_time()
    personal = check_measurement(inputs.personal_measurement, inputs.activity, 'PERSONAL', at)
    environment = check_measurement(inputs.environment_measurement, inputs.activity, 'ENVIRONMENTAL', at)
    solar = inputs.solar_event is not None
    personal_reason = {'USABLE': 'PERSONAL_AVAILABLE', 'MISSING': 'PERSONAL_MISSING', 'STALE': 'PERSONAL_STALE', 'INCOMPATIBLE': 'PERSONAL_INCOMPATIBLE', 'REVIEW_REQUIRED': 'PERSONAL_QUALITY_REVIEW'}[personal.state]
    steps = [PreparationStep(id='context', state='AVAILABLE' if inputs.activity else 'MISSING', reason='ACTIVITY_SCHEDULED' if inputs.activity else 'ACTIVITY_MISSING'),
        PreparationStep(id='radiological', state='MISSING' if environment.state != 'USABLE' else 'ATTENTION' if solar else 'AVAILABLE', reason='ENVIRONMENT_CONTEXT_MISSING' if environment.state == 'MISSING' else 'ENVIRONMENT_UNUSABLE' if environment.state != 'USABLE' else 'SOLAR_EVENT' if solar else 'RADIOLOGICAL_DATA_AVAILABLE'),
        PreparationStep(id='personal', state='AVAILABLE' if personal.state == 'USABLE' else 'MISSING' if personal.state == 'MISSING' else 'ATTENTION', reason=personal_reason)]
    incomplete = not inputs.activity or environment.state != 'USABLE' or personal.state != 'USABLE'
    if not inputs.activity:
        action = 'CONFIRM_ACTIVITY'
    elif environment.state != 'USABLE':
        action = 'CHECK_ENVIRONMENT'
    elif personal.state != 'USABLE':
        action = {'MISSING': 'CHECK_PERSONAL', 'STALE': 'REFRESH_PERSONAL', 'INCOMPATIBLE': 'CHECK_ASSOCIATION', 'REVIEW_REQUIRED': 'CHECK_QUALITY'}[personal.state]
    elif solar:
        action = 'FOLLOW_UP' if acknowledged else 'REVIEW_SOLAR_EVENT'
    else:
        action = 'NONE' if acknowledged else 'RECORD_REVIEW'
    return OperationalAssessment(data_state='INCOMPLETE' if incomplete else 'ATTENTION' if solar else 'AVAILABLE',
        radiological_state='REMOTE_EVENT_REVIEW' if solar else 'INDIVIDUAL_READING_AVAILABLE' if personal.state == 'USABLE' else 'INDIVIDUAL_READING_UNUSABLE',
        review_state='RECORDED' if acknowledged else 'PENDING', requires_attention=bool(incomplete or solar or not acknowledged),
        next_action=action, available_count=int(inputs.activity is not None) + int(environment.state == 'USABLE') + int(personal.state == 'USABLE'),
        personal_check=personal, environment_check=environment, steps=steps)


def assessment_signature(assessment: OperationalAssessment) -> str:
    # Ages change each second; only semantic changes invalidate a consultation.
    return '|'.join([assessment.data_state, assessment.radiological_state, assessment.personal_check.state,
        ','.join(assessment.personal_check.issues), assessment.environment_check.state, ','.join(assessment.environment_check.issues)])
