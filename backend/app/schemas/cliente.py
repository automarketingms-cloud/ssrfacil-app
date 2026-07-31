from pydantic import BaseModel
from datetime import date
from typing import Optional


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


class ClienteResponse(ClienteBase):
    id: int

    class Config:
        from_attributes = True