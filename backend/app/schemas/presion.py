from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field


class MedicionPresionCreate(BaseModel):
    punto_medicion: str
    ubicacion: Optional[str] = None
    fecha_medicion: date
    hora_medicion: Optional[time] = None
    presion_mca: float = Field(gt=0)
    observaciones: Optional[str] = None