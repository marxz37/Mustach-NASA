"""Mustach local API: scientific observations, forecasts and isolated EVA demonstration."""
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
from hmac import compare_digest
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AwareDatetime, BaseModel, Field, model_validator

from .db import (get_alerts, get_demo_event, get_events, get_forecasts, get_ingestion_runs,
                 get_measurements, get_measurement_stats, get_source_states, init_db, record_ingestion, save_measurements,
                 update_demo_event)
from . import operational as op
from .operational import OperationalAssessment, ScenarioId, ScenarioInputs
from .measurements import Measurement
from . import simulation
from .solar_notices import eligible_notices


class ApiStatus(BaseModel):
    api: Literal["online"] = "online"
    mode: Literal["empty_prototype", "scientific_data"] = "empty_prototype"
    measurements: int = 0
    last_update: datetime | None = None


class SourceInfo(BaseModel):
    id: str
    name: str
    category: str
    connected: bool = False
    description: str
    last_attempt_at: datetime | None = None
    error: str | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Mustach — Space Radiation Monitoring API",
    description="Dados científicos rastreáveis e protótipo EVA separado. Não fornece dosimetria clínica individual.",
    version="0.5.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "prototype": True}


@app.get("/api/v1/status", response_model=ApiStatus)
def api_status():
    count, collected_at = get_measurement_stats()
    return ApiStatus(mode='scientific_data' if count else 'empty_prototype', measurements=count,
                     last_update=datetime.fromisoformat(collected_at) if collected_at else None)


@app.get("/api/v1/measurements", response_model=list[Measurement])
def measurements(limit: int = Query(default=500, ge=1, le=2000), source: str | None = None,
                 quantity: str | None = None, start: AwareDatetime | None = None, end: AwareDatetime | None = None):
    if start and end and end <= start:
        raise HTTPException(status_code=422, detail='end must follow start')
    return get_measurements(limit=limit, source=source, quantity=quantity,
                            start=start.astimezone(timezone.utc).isoformat() if start else None,
                            end=end.astimezone(timezone.utc).isoformat() if end else None)


@app.get('/api/v1/science/ingestion-runs')
def ingestion_runs(limit: int = Query(default=30, ge=1, le=100)):
    return get_ingestion_runs(limit)


@app.get('/api/v1/solar/alerts')
def solar_alerts(limit: int = Query(default=20, ge=1, le=100)):
    return get_alerts(limit)


@app.post('/api/v1/science/measurements', status_code=201)
def receive_scientific_measurement(measurement: Measurement, x_mustach_ingest_token: str | None = Header(default=None)):
    expected = os.getenv('MUSTACH_INGEST_TOKEN')
    if not expected:
        raise HTTPException(status_code=503, detail='Scientific ingestion is disabled')
    if not x_mustach_ingest_token or not compare_digest(x_mustach_ingest_token, expected):
        raise HTTPException(status_code=401, detail='Invalid ingestion token')
    if measurement.source not in ('LOCAL_IMPORT', 'LOCAL_SENSOR') or measurement.provenance != 'OBSERVED':
        raise HTTPException(status_code=422, detail='Only local observed records are accepted here')
    accepted_units = {'absorbed_dose_rate': ('µGy/h', 'uGy/h', 'μGy/h'),
                      'dose_equivalent_rate': ('µSv/h', 'uSv/h', 'μSv/h', 'mSv/h'),
                      'integral_proton_flux': ('pfu',)}
    if measurement.quantity not in accepted_units or measurement.unit not in accepted_units[measurement.quantity]:
        record_ingestion('local-measurement', 'ERROR', error='Leitura incompatível: grandeza ou unidade não aceita')
        raise HTTPException(status_code=422, detail='Incompatible quantity and unit')
    if measurement.scope == 'PERSONAL' and not measurement.astronaut_id:
        raise HTTPException(status_code=422, detail='Personal measurement requires astronaut_id')
    if measurement.measured_at > datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail='Measurement timestamp is in the future')
    try:
        added = save_measurements([measurement.model_copy(update={'collected_at': datetime.now(timezone.utc)})])
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {'id': measurement.id, 'inserted': added == 1}


@app.get("/api/v1/crew", response_model=list[dict])
def crew():
    return []


@app.get("/api/v1/solar-events", response_model=list[dict])
def solar_events():
    return get_events()


class SolarForecastModel(BaseModel):
    """Uma previsão por modelo; horizontes e unidades nunca são combinados."""

    id: str
    source: str
    provider: str
    model: str
    provenance: Literal["FORECAST"] = "FORECAST"
    issued_at: datetime
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    occurrence_probability_percent: float | None = Field(default=None, ge=0, le=100)
    peak_proton_flux: float | None = Field(default=None, ge=0)
    peak_proton_flux_unit: str | None = None
    proton_energy_min_mev: float | None = Field(default=None, ge=0)
    proton_energy_max_mev: float | None = Field(default=None, ge=0)
    event_start_at: datetime | None = None
    event_peak_at: datetime | None = None
    event_end_at: datetime | None = None
    forecast_horizon_day: int | None = None
    threshold: str | None = None
    location: str | None = None
    source_url: str | None = None


class SolarForecastResponse(BaseModel):
    status: Literal["available", "no_forecast"] = "no_forecast"
    models: list[SolarForecastModel] = Field(default_factory=list)


@app.get("/api/v1/solar/forecast", response_model=SolarForecastResponse)
def solar_forecast():
    """Only unexpired scientific forecasts appear as current; archives remain in SQLite."""
    now = datetime.now(timezone.utc)
    models = [item for item in get_forecasts() if datetime.fromisoformat(item['issued_at']) <= now
              and (not item.get('valid_until') or datetime.fromisoformat(item['valid_until']) >= now)]
    return SolarForecastResponse(status='available' if models else 'no_forecast', models=models)


@app.get('/api/v1/solar/forecast/history', response_model=list[SolarForecastModel])
def solar_forecast_history(limit: int = Query(default=50, ge=1, le=100)):
    return get_forecasts(limit)


@app.get("/api/v1/sources", response_model=list[SourceInfo])
def sources():
    states = get_source_states()
    def info(id: str, name: str, category: str, description: str, state_key: str):
        state = states.get(state_key)
        return SourceInfo(id=id, name=name, category=category, description=description,
                          connected=state is not None and state['status'] == 'OK',
                          last_attempt_at=state['attempted_at'] if state else None,
                          error=state['error'] if state else None)
    return [
        info('radlab', 'NASA RadLab', 'OBSERVED', 'Medições instrumentais históricas.', 'radlab'),
        info('noaa', 'NOAA SWPC', 'OBSERVED', 'Fluxos integrais de prótons GOES.', 'goes'),
        info('donki', 'NASA DONKI', 'EVENT', 'Catálogo de eventos SEP registrados, sem inferência causal.', 'donki'),
        info('sep', 'NASA CCMC SEP Scoreboard', 'FORECAST', 'Previsões de modelos no CCMC.', 'ccmc'),
        info('csa', 'CSA Radi-N2', 'REFERENCE', 'Referência de monitoramento de nêutrons.', 'csa'),
    ]


class WearableStatus(BaseModel):
    """Estado legível pelo protótipo de relógio; sem alegar pareamento ou dados clínicos."""

    paired: bool = False
    health_status: Literal["not_evaluated"] = "not_evaluated"
    heart_rate_bpm: float | None = None
    accumulated_dose_msv: float | None = None
    last_health_measurement: datetime | None = None
    solar_status: Literal["no_forecast"] = "no_forecast"
    last_solar_update: datetime | None = None


@app.get("/api/v1/wearable/status", response_model=WearableStatus)
def wearable_status():
    """A interface e o wearable compartilham a API, mas nenhum dispositivo está conectado."""
    return WearableStatus()


@app.get('/api/v1/wearable/solar-notices')
def wearable_solar_notices():
    return eligible_notices()


class SimulationCommand(BaseModel):
    action: Literal['select', 'start', 'pause', 'resume', 'reset', 'speed']
    expected_revision: int = Field(ge=1)
    scenario: Literal['normal', 'predicted', 'ongoing', 'recovery'] | None = None
    speed: Literal[1, 10, 60] | None = None


@app.get('/api/v1/demo/simulation')
def simulation_state():
    return simulation.access()


@app.post('/api/v1/demo/simulation')
def simulation_command(body: SimulationCommand):
    try:
        return simulation.access(**body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

# Dev-only presence signal from the standalone wearable WEB PREVIEW.
# This is not a physical watch pairing, and carries no personal health data.
from datetime import timezone, timedelta

class WearableConnection(BaseModel):
    paired: bool = False
    preview_active: bool = False
    last_seen_at: datetime | None = None

_last_preview_ping: datetime | None = None

@app.post('/api/v1/wearable/heartbeat', response_model=WearableConnection)
def wearable_heartbeat():
    global _last_preview_ping
    _last_preview_ping = datetime.now(timezone.utc)
    return wearable_connection()

@app.get('/api/v1/wearable/connection', response_model=WearableConnection)
def wearable_connection():
    now = datetime.now(timezone.utc)
    return WearableConnection(
        preview_active=_last_preview_ping is not None and now - _last_preview_ping < timedelta(seconds=90),
        last_seen_at=_last_preview_ping,
    )


class InputSummary(BaseModel):
    activity_available: bool
    environment_context_available: bool
    solar_event_flagged: bool
    personal_reading_available: bool


class DemoOperationalEvent(BaseModel):
    id: Literal['DEMO-EVT-001'] = 'DEMO-EVT-001'
    provenance: Literal['SIMULATED'] = 'SIMULATED'
    activity: Literal['EVA-01'] = 'EVA-01'
    phase: Literal['PREPARATION'] = 'PREPARATION'
    status: Literal['REVIEW_PENDING', 'REVIEW_RECORDED']
    fact: Literal['SOLAR_PARTICLE_EVENT', 'NO_FLAGGED_EVENT']
    source: Literal['DEMO-SOLAR-01'] = 'DEMO-SOLAR-01'
    scenario_at: datetime = datetime(2026, 11, 15, 12, tzinfo=timezone.utc)
    scheduled_at: datetime | None
    scenario_id: ScenarioId
    inputs: InputSummary
    evidence: ScenarioInputs
    evaluated_at: datetime
    reading_received_at: datetime | None
    assessment: OperationalAssessment
    missing_data: list[Literal['PERSONAL_DOSIMETER_READING', 'ACTIVITY_CONTEXT', 'ENVIRONMENT_CONTEXT']]
    personal_reading_available: bool
    next_check: Literal['DEMO-RAD-01'] = 'DEMO-RAD-01'
    acknowledged_at: datetime | None
    revision: int


class DemoRevision(BaseModel):
    expected_revision: int = Field(ge=1)


class DemoScenarioUpdate(DemoRevision):
    personal_reading_available: bool | None = None
    scenario_id: ScenarioId | None = None

    @model_validator(mode='after')
    def one_scenario_selector(self):
        if (self.personal_reading_available is None) == (self.scenario_id is None):
            raise ValueError('Supply either scenario_id or personal_reading_available.')
        return self


class DemoAcknowledgement(DemoRevision):
    context_reviewed: Literal[True]
    availability_checked: Literal[True]


@app.get('/api/v1/demo/operational-event', response_model=DemoOperationalEvent)
def demo_operational_event():
    row = get_demo_event()
    evidence, assessment = row['_context'], row['_assessment']
    inputs = InputSummary(activity_available=evidence.activity is not None,
        environment_context_available=assessment.environment_check.state == 'USABLE',
        solar_event_flagged=evidence.solar_event is not None,
        personal_reading_available=assessment.personal_check.state == 'USABLE')
    missing = []
    if not inputs.activity_available:
        missing.append('ACTIVITY_CONTEXT')
    if not inputs.environment_context_available:
        missing.append('ENVIRONMENT_CONTEXT')
    if not inputs.personal_reading_available:
        missing.append('PERSONAL_DOSIMETER_READING')
    return DemoOperationalEvent(
        scenario_id=row['scenario_id'], inputs=inputs, evidence=evidence, assessment=assessment,
        evaluated_at=row['_evaluated_at'], reading_received_at=row['reading_received_at'],
        status='REVIEW_PENDING' if assessment.requires_attention else 'REVIEW_RECORDED',
        fact='SOLAR_PARTICLE_EVENT' if inputs.solar_event_flagged else 'NO_FLAGGED_EVENT',
        scenario_at=evidence.scenario_at, scheduled_at=evidence.activity.scheduled_at if evidence.activity else None,
        personal_reading_available=inputs.personal_reading_available, missing_data=missing,
        acknowledged_at=row['acknowledged_at'], revision=row['revision'],
    )


def require_current_demo(updated: bool):
    if not updated:
        raise HTTPException(status_code=409, detail='Scenario changed. Reload before registering a check.')


@app.post('/api/v1/demo/operational-event/scenario', response_model=DemoOperationalEvent)
def change_demo_scenario(body: DemoScenarioUpdate):
    require_current_demo(update_demo_event(body.expected_revision, reading_available=body.personal_reading_available, scenario_id=body.scenario_id))
    return demo_operational_event()


@app.post('/api/v1/demo/operational-event/acknowledge', response_model=DemoOperationalEvent)
def acknowledge_demo_event(body: DemoAcknowledgement):
    # Acknowledgement records a check, never grants EVA clearance or fills a missing measurement.
    require_current_demo(update_demo_event(body.expected_revision, acknowledged_at=op.current_time().isoformat()))
    return demo_operational_event()


class DemoMeasurementUpdate(DemoRevision):
    measurement: Measurement | None = None

    @model_validator(mode='after')
    def simulated_only(self):
        if self.measurement is not None and self.measurement.provenance != 'SIMULATED':
            raise ValueError('The demonstration endpoint accepts SIMULATED evidence only.')
        return self


@app.post('/api/v1/demo/operational-event/personal-measurement', response_model=DemoOperationalEvent)
def receive_demo_measurement(body: DemoMeasurementUpdate):
    row = get_demo_event()
    require_current_demo(row['revision'] == body.expected_revision)
    activity = row['_context'].activity
    if body.measurement is None and activity is None:
        raise HTTPException(status_code=409, detail='Activity context is required to generate demo evidence.')
    measurement = body.measurement or op.personal_fixture(activity, op.current_time())
    require_current_demo(update_demo_event(body.expected_revision, measurement=measurement))
    return demo_operational_event()
