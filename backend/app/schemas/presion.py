from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class MedicionPresionCreate(BaseModel):
    punto_medicion: str
    ubicacion: Optional[str] = None
    presion_mca: float = Field(gt=0)
    observaciones: Optional[str] = None
    reclamo_id: Optional[int] = None



class MedicionPresionUpdate(BaseModel):
    """Todos opcionales: solo se modifican los campos que vienen en el request."""
    punto_medicion: Optional[str] = None
    ubicacion: Optional[str] = None
    fecha_medicion: Optional[date] = None
    hora_medicion: Optional[time] = None
    presion_mca: Optional[float] = Field(default=None, gt=0)
    observaciones: Optional[str] = None
    reclamo_id: Optional[int] = None

    @field_validator("punto_medicion")
    @classmethod
    def no_vacio(cls, v):
        # solo se ejecuta si el campo viene en el request
        if v is None or not v.strip():
            raise ValueError("Este campo no puede quedar vacío")
        return v.strip()

    @field_validator("fecha_medicion", "presion_mca")
    @classmethod
    def no_nulo(cls, v):
        if v is None:
            raise ValueError("Este campo no puede quedar vacío")
        return v