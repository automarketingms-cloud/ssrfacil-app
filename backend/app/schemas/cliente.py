from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional

from app.utils.rut import validar_rut


class ClienteBase(BaseModel):
    nombre: str
    rut: str
    direccion: str 
    numero_medidor: str
    fecha_ingreso: Optional[date] = None
    activo: bool = True
    es_socio: bool = True
    tiene_subsidio: bool = False
    porcentaje_subsidio: float = 0.0  # ej: 0.5 = 50%
    tipo_cliente: Optional[str] = None  # "persona_natural" | "persona_juridica"
    giro: Optional[str] = None
    comuna: Optional[str] = None

    @field_validator("rut")
    @classmethod
    def validar_rut_cliente(cls, v: str) -> str:
        if not validar_rut(v):
            raise ValueError("RUT inválido")
        return v

    @field_validator("tipo_cliente")
    @classmethod
    def validar_tipo_cliente(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("persona_natural", "persona_juridica"):
            raise ValueError("tipo_cliente debe ser 'persona_natural' o 'persona_juridica'")
        return v


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    """Todos los campos opcionales: se actualiza solo lo que venga en el body."""
    nombre: Optional[str] = None
    rut: Optional[str] = None
    direccion: Optional[str] = None
    numero_medidor: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    activo: Optional[bool] = None
    es_socio: Optional[bool] = None
    tiene_subsidio: Optional[bool] = None
    porcentaje_subsidio: Optional[float] = None
    tipo_cliente: Optional[str] = None
    giro: Optional[str] = None
    comuna: Optional[str] = None

    @field_validator("rut")
    @classmethod
    def validar_rut_cliente_update(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not validar_rut(v):
            raise ValueError("RUT inválido")
        return v

    @field_validator("tipo_cliente")
    @classmethod
    def validar_tipo_cliente_update(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("persona_natural", "persona_juridica"):
            raise ValueError("tipo_cliente debe ser 'persona_natural' o 'persona_juridica'")
        return v


class ClienteResponse(ClienteBase):
    id: int
    empresa_id: int

    class Config:
        from_attributes = True


class ClienteListResponse(BaseModel):
    items: list[ClienteResponse]
    total: int
    page: int
    limit: int