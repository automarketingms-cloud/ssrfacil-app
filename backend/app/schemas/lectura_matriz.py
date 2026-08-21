from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class LecturaMatrizCreate(BaseModel):
    periodo: str = Field(..., examples=["2026-08"])
    fecha_lectura: date
    lectura_actual: float
    observaciones: Optional[str] = None

class LecturaMatrizUpdate(BaseModel):
    lectura_actual: Optional[float] = None
    fecha_lectura: Optional[date] = None
    observaciones: Optional[str] = None

class LecturaMatrizResponse(LecturaMatrizCreate):
    id: int
    consumo_m3: float
    tiene_foto: bool = False

    class Config:
        from_attributes = True