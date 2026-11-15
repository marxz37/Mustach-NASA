/** Presentation contract only. All preparation rules run in FastAPI. */
export type ScenarioId = 'missing_personal' | 'solar_review' | 'complete' | 'missing_environment' | 'missing_context';
export type PreparationStepId = 'context' | 'radiological' | 'personal';
export type PreparationState = 'AVAILABLE' | 'ATTENTION' | 'MISSING';
export type NextAction = 'CONFIRM_ACTIVITY' | 'CHECK_ENVIRONMENT' | 'CHECK_PERSONAL' | 'REVIEW_SOLAR_EVENT' | 'RECORD_REVIEW' | 'FOLLOW_UP' | 'NONE';
export interface PreparationStep {
  id: PreparationStepId;
  state: PreparationState;
  reason: 'ACTIVITY_SCHEDULED' | 'ACTIVITY_MISSING' | 'SOLAR_EVENT' | 'ENVIRONMENT_CONTEXT_MISSING' | 'RADIOLOGICAL_DATA_AVAILABLE' | 'PERSONAL_AVAILABLE' | 'PERSONAL_MISSING';
}
export interface OperationalEvent {
  id: 'DEMO-EVT-001';
  provenance: 'SIMULATED';
  activity: 'EVA-01';
  phase: 'PREPARATION';
  status: 'REVIEW_PENDING' | 'REVIEW_RECORDED';
  fact: 'SOLAR_PARTICLE_EVENT' | 'NO_FLAGGED_EVENT';
  source: 'DEMO-SOLAR-01';
  scenario_at: string;
  scheduled_at: string | null;
  scenario_id: ScenarioId;
  inputs: {
    activity_available: boolean;
    environment_context_available: boolean;
    solar_event_flagged: boolean;
    personal_reading_available: boolean;
  };
  assessment: {
    data_state: 'INCOMPLETE' | 'ATTENTION' | 'AVAILABLE';
    review_state: 'PENDING' | 'RECORDED';
    requires_attention: boolean;
    next_action: NextAction;
    available_count: number;
    steps: PreparationStep[];
  };
  missing_data: ('PERSONAL_DOSIMETER_READING' | 'ACTIVITY_CONTEXT' | 'ENVIRONMENT_CONTEXT')[];
  personal_reading_available: boolean;
  next_check: 'DEMO-RAD-01';
  acknowledged_at: string | null;
  revision: number;
}

const path = '/api/v1/demo/operational-event';
async function request(base: string, suffix = '', body?: object): Promise<OperationalEvent> {
  const response = await fetch(`${base}${path}${suffix}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { Accept: 'application/json', 'Content-Type': 'application/json' } : { Accept: 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(response.status === 409 ? 'SCENARIO_CHANGED' : 'API_UNAVAILABLE');
  return response.json() as Promise<OperationalEvent>;
}
export const getOperationalEvent = (base: string) => request(base);
export const changeOperationalScenario = (base: string, event: OperationalEvent, scenario: ScenarioId) =>
  request(base, '/scenario', { expected_revision: event.revision, scenario_id: scenario });
export const acknowledgeOperationalEvent = (base: string, event: OperationalEvent) =>
  request(base, '/acknowledge', { expected_revision: event.revision, context_reviewed: true, availability_checked: true });
