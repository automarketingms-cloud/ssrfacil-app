from pydantic import BaseModel
from datetime import date

class LecturaCreate(BaseModel):
    cliente_id: int
    fecha_lectura: date
    periodo: str  # ej: "2026-07"
    lectura_actual: float

class LecturaResponse(LecturaCreate):
    id: int
    consumo_m3: float

    class Config:
        from_attributes = True