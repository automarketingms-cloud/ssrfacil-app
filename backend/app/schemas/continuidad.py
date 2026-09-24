from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, Literal
from zoneinfo import ZoneInfo

TZ_CHILE = ZoneInfo("America/Santiago")


def _asumir_hora_chile(v: datetime) -> datetime:
    """Si la fecha llega sin zona horaria (input datetime-local), se asume hora de Chile."""
    if v.tzinfo is None:
        return v.replace(tzinfo=TZ_CHILE)
    return v


class CorteCreate(BaseModel):
    fecha_hora_inicio: datetime
    tipo: Literal["programado", "no_programado"]
    causa: str
    sector_afectado: str
    clientes_afectados: Optional[int] = None
    observaciones: Optional[str] = None

    @field_validator("fecha_hora_inicio")
    @classmethod
    def inicio_con_zona(cls, v: datetime) -> datetime:
        return _asumir_hora_chile(v)


class CorteCierre(BaseModel):
    fecha_hora_termino: datetime

    @field_validator("fecha_hora_termino")
    @classmethod
    def termino_con_zona(cls, v: datetime) -> datetime:
        return _asumir_hora_chile(v)


class CorteResponse(BaseModel):
    id: int
    fecha_hora_inicio: datetime
    fecha_hora_termino: Optional[datetime]
    tipo: str
    causa: str
    sector_afectado: str
    clientes_afectados: Optional[int]
    observaciones: Optional[str]
    duracion_horas: Optional[float] = None  # calculada en el service, no viene de la BD

    model_config = ConfigDict(from_attributes=True)