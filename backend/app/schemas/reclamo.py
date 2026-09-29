from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime, date
from typing import Optional


class ReclamoCreate(BaseModel):
    cliente_id: Optional[int] = None
    nombre_reclamante: Optional[str] = None
    rut_reclamante: Optional[str] = None
    direccion_reclamo: Optional[str] = None
    tipo_reclamo: str
    descripcion: str
    observaciones: Optional[str] = None

    @model_validator(mode="after")
    def validar_identificacion_reclamante(self):
        if self.cliente_id is None:
            if not self.nombre_reclamante or not self.rut_reclamante:
                raise ValueError(
                    "Si el reclamo no tiene cliente_id, nombre_reclamante y rut_reclamante son obligatorios"
                )
        return self


class ReclamoResponder(BaseModel):
    respuesta: str

class ReclamoCerrarDirecto(BaseModel):
    motivo: str



class ReclamoUpdate(BaseModel):
    """Todos opcionales: solo se modifican los campos que vienen en el request."""
    cliente_id: Optional[int] = None
    nombre_reclamante: Optional[str] = None
    rut_reclamante: Optional[str] = None
    direccion_reclamo: Optional[str] = None
    tipo_reclamo: Optional[str] = None
    descripcion: Optional[str] = None
    observaciones: Optional[str] = None
    respuesta: Optional[str] = None

    @field_validator("tipo_reclamo", "descripcion", "respuesta")
    @classmethod
    def no_vacio(cls, v):
        # solo se ejecuta si el campo viene en el request
        if v is None or not v.strip():
            raise ValueError("Este campo no puede quedar vacío")
        return v

class ReclamoResponse(BaseModel):
    id: int
    folio: str
    anio: int
    cliente_id: Optional[int]
    nombre_reclamante: Optional[str]
    rut_reclamante: Optional[str]
    direccion_reclamo: Optional[str]
    tipo_reclamo: str
    descripcion: str
    fecha_recepcion: datetime
    plazo_vencimiento: date
    estado: str
    fecha_respuesta: Optional[datetime]
    respuesta: Optional[str]
    dias_habiles_respuesta: Optional[int]
    fuera_de_plazo: Optional[bool]
    motivo_cierre: Optional[str]
    observaciones: Optional[str]
    editado_por_id: Optional[int] = None
    editado_por_nombre: Optional[str] = None
    fecha_edicion: Optional[datetime] = None

    class Config:
        from_attributes = True