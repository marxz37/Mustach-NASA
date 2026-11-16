"""Measurement contract shared by observed API records and explicitly simulated evidence."""
from typing import Any, Literal
from pydantic import AwareDatetime, BaseModel, Field


class Measurement(BaseModel):
    id: str = Field(min_length=1)
    source: str = Field(min_length=1)
    provenance: Literal['OBSERVED', 'FORECAST', 'SIMULATED']
    instrument: str = Field(min_length=1)
    measured_at: AwareDatetime
    quantity: str = Field(min_length=1)
    value: float = Field(ge=0, allow_inf_nan=False)
    unit: str = Field(min_length=1)
    mission: str = Field(min_length=1)
    region: str | None = None
    scope: Literal['ENVIRONMENTAL', 'PERSONAL'] = 'ENVIRONMENTAL'
    astronaut_id: str | None = None
    activity_id: str | None = None
    location: str | None = None
    quality: Literal['VALID', 'REVIEW_REQUIRED', 'UNKNOWN'] = 'UNKNOWN'
    collected_at: AwareDatetime | None = None
    source_url: str | None = None
    details: dict[str, Any] | None = None
