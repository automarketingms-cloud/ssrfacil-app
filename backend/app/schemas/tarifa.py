from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List


class TarifaTramoBase(BaseModel):
    numero_tramo: int
    desde_m3: float = Field(gt=0)
    hasta_m3: Optional[float] = None  # None = sin limite superior
    precio_m3: float = Field(gt=0)


class TarifaTramoCreate(TarifaTramoBase):
    pass


class TarifaTramoResponse(TarifaTramoBase):
    id: int

    class Config:
        from_attributes = True


class TarifaCreate(BaseModel):
    nombre: str
    cargo_fijo: float
    vigente_desde: date
    tramos: List[TarifaTramoCreate]


class TarifaResponse(BaseModel):
    id: int
    nombre: str
    cargo_fijo: float
    vigente_desde: date
    tramos: List[TarifaTramoResponse]

    class Config:
        from_attributes = True