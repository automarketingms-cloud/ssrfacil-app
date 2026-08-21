from pydantic import BaseModel, Field, field_validator
from typing import Optional

from app.utils.rut import validar_rut


class ConfiguracionBase(BaseModel):
    nombre_empresa: Optional[str] = None
    rut_empresa: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    horario_atencion: Optional[str] = None
    email: Optional[str] = None
    giro: Optional[str] = None
    dias_plazo_pago: int = Field(default=30, gt=0)
    dia_facturacion: int = Field(default=20, ge=1, le=31)
    tasa_interes_mora: float = Field(default=0, ge=0)
    tasa_iva: float = Field(default=19.0, ge=0)
    numero_medidor_matriz: Optional[str] = None

    @field_validator("rut_empresa")
    @classmethod
    def validar_rut_empresa(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not validar_rut(v):
            raise ValueError("RUT de empresa inválido")
        return v


class ConfiguracionUpdate(ConfiguracionBase):
    pass


class ConfiguracionResponse(ConfiguracionBase):
    id: int

    class Config:
        from_attributes = True