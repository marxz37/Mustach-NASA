"""API REST do protótipo. Nenhuma integração da NASA/NOAA está ativa nesta fase."""
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from .db import get_demo_event, get_measurements, init_db, update_demo_event
from . import operational as op
from .operational import OperationalAssessment, ScenarioId, ScenarioInputs
from .measurements import Measurement


class ApiStatus(BaseModel):
    api: Literal["online"] = "online"
    mode: Literal["empty_prototype"] = "empty_prototype"
    measurements: int = 0
    last_update: datetime | None = None


class SourceInfo(BaseModel):
    id: str
    name: str
    category: str
    connected: bool = False
    description: str


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Mustach — Space Radiation Monitoring API",
    description="Esqueleto para integrações científicas futuras. Não fornece dosimetria individual real.",
    version="0.4.0",
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
    rows = get_measurements()
    return ApiStatus(measurements=len(rows), last_update=None)


@app.get("/api/v1/measurements", response_model=list[Measurement])
def measurements(limit: int = Query(default=500, ge=1, le=2000)):
    return get_measurements(limit=limit)


@app.get("/api/v1/crew", response_model=list[dict])
def crew():
    return []


@app.get("/api/v1/solar-events", response_model=list[dict])
def solar_events():
    return []


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


class SolarForecastResponse(BaseModel):
    status: Literal["available", "no_forecast"] = "no_forecast"
    models: list[SolarForecastModel] = Field(default_factory=list)


@app.get("/api/v1/solar/forecast", response_model=SolarForecastResponse)
def solar_forecast():
    """Contrato compartilhado para previsões futuras de SEP; nenhuma fonte está conectada."""
    return SolarForecastResponse()


@app.get("/api/v1/sources", response_model=list[SourceInfo])
def sources():
    return [
        SourceInfo(id="radlab", name="NASA RadLab", category="OBSERVED", description="Medições de radiação de instrumentos espaciais."),
        SourceInfo(id="noaa", name="NOAA SWPC", category="OBSERVED", description="Fluxos de prótons GOES."),
        SourceInfo(id="donki", name="NASA DONKI", category="EVENT", description="Eventos solares registrados."),
        SourceInfo(id="sep", name="NASA SEP Scoreboard", category="FORECAST", description="Previsões solares de modelos científicos."),
        SourceInfo(id="csa", name="CSA Radi-N2", category="REFERENCE", description="Referência científica de monitoramento de nêutrons."),
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
