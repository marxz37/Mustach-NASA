"""One deterministic pre-EVA assessment, consumed by both interfaces.

Availability and review state are not health classifications or EVA clearance.
Inputs below are variants of a fixed demonstrative activity, not measurements.
"""
from typing import Literal

from pydantic import BaseModel

ScenarioId = Literal['missing_personal', 'solar_review', 'complete', 'missing_environment', 'missing_context']


class ScenarioInputs(BaseModel):
    activity_available: bool = True
    environment_context_available: bool = True
    solar_event_flagged: bool = False
    personal_reading_available: bool = True


SCENARIOS: dict[str, ScenarioInputs] = {
    'missing_personal': ScenarioInputs(solar_event_flagged=True, personal_reading_available=False),
    'solar_review': ScenarioInputs(solar_event_flagged=True),
    'complete': ScenarioInputs(),
    'missing_environment': ScenarioInputs(environment_context_available=False),
    'missing_context': ScenarioInputs(activity_available=False, environment_context_available=False),
}


class PreparationStep(BaseModel):
    id: Literal['context', 'radiological', 'personal']
    state: Literal['AVAILABLE', 'ATTENTION', 'MISSING']
    reason: Literal[
        'ACTIVITY_SCHEDULED', 'ACTIVITY_MISSING', 'SOLAR_EVENT',
        'ENVIRONMENT_CONTEXT_MISSING', 'RADIOLOGICAL_DATA_AVAILABLE',
        'PERSONAL_AVAILABLE', 'PERSONAL_MISSING',
    ]


class OperationalAssessment(BaseModel):
    data_state: Literal['INCOMPLETE', 'ATTENTION', 'AVAILABLE']
    review_state: Literal['PENDING', 'RECORDED']
    requires_attention: bool
    next_action: Literal[
        'CONFIRM_ACTIVITY', 'CHECK_ENVIRONMENT', 'CHECK_PERSONAL',
        'REVIEW_SOLAR_EVENT', 'RECORD_REVIEW', 'FOLLOW_UP', 'NONE',
    ]
    available_count: int
    steps: list[PreparationStep]


def assess_preparation(inputs: ScenarioInputs, acknowledged: bool) -> OperationalAssessment:
    steps = [
        PreparationStep(id='context', state='AVAILABLE' if inputs.activity_available else 'MISSING',
                        reason='ACTIVITY_SCHEDULED' if inputs.activity_available else 'ACTIVITY_MISSING'),
        PreparationStep(
            id='radiological',
            state='MISSING' if not inputs.environment_context_available else 'ATTENTION' if inputs.solar_event_flagged else 'AVAILABLE',
            reason='ENVIRONMENT_CONTEXT_MISSING' if not inputs.environment_context_available else 'SOLAR_EVENT' if inputs.solar_event_flagged else 'RADIOLOGICAL_DATA_AVAILABLE',
        ),
        PreparationStep(id='personal', state='AVAILABLE' if inputs.personal_reading_available else 'MISSING',
                        reason='PERSONAL_AVAILABLE' if inputs.personal_reading_available else 'PERSONAL_MISSING'),
    ]
    missing = any(step.state == 'MISSING' for step in steps)
    attention = inputs.solar_event_flagged
    if not inputs.activity_available:
        action = 'CONFIRM_ACTIVITY'
    elif not inputs.environment_context_available:
        action = 'CHECK_ENVIRONMENT'
    elif not inputs.personal_reading_available:
        action = 'CHECK_PERSONAL'
    elif attention:
        action = 'FOLLOW_UP' if acknowledged else 'REVIEW_SOLAR_EVENT'
    else:
        action = 'NONE' if acknowledged else 'RECORD_REVIEW'
    return OperationalAssessment(
        data_state='INCOMPLETE' if missing else 'ATTENTION' if attention else 'AVAILABLE',
        review_state='RECORDED' if acknowledged else 'PENDING',
        requires_attention=missing or attention or not acknowledged,
        next_action=action,
        # Attention is available information that needs review, not a completed safety check.
        available_count=sum(step.state != 'MISSING' for step in steps),
        steps=steps,
    )
