# schemas/continuidad.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Literal

class CorteCreate(BaseModel):
    fecha_hora_inicio: datetime
    tipo: Literal["programado", "no_programado"]
    causa: str
    sector_afectado: str
    clientes_afectados: Optional[int] = None
    observaciones: Optional[str] = None

class CorteCierre(BaseModel):
    fecha_hora_termino: datetime

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