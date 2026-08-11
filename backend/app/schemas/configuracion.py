from pydantic import BaseModel, Field
from typing import Optional

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

class ConfiguracionUpdate(ConfiguracionBase):
    pass

class ConfiguracionResponse(ConfiguracionBase):
    id: int

    class Config:
        from_attributes = True