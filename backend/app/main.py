"""API REST do protótipo. Nenhuma integração da NASA/NOAA está ativa nesta fase."""
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .db import get_measurements, init_db


class Measurement(BaseModel):
    id: str
    source: str
    provenance: Literal["OBSERVED", "FORECAST", "SIMULATED"]
    instrument: str
    measured_at: datetime
    quantity: str
    value: float = Field(ge=0)
    unit: str
    mission: str
    region: str | None = None


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
    version="0.3.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
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
