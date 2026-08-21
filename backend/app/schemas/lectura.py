from pydantic import BaseModel
from datetime import date

class LecturaCreate(BaseModel):
    cliente_id: int
    fecha_lectura: date
    periodo: str  # ej: "2026-07"
    lectura_actual: float
    es_promedio: bool = False

class LecturaResponse(LecturaCreate):
    id: int
    consumo_m3: float | None = None
    tiene_foto: bool = False
    facturada: bool = False

    class Config:
        from_attributes = True

class LecturaListResponse(BaseModel):
    items: list[LecturaResponse]
    total: int
    page: int
    limit: int
    
class LecturaUpdate(BaseModel):
    fecha_lectura: date | None = None
    periodo: str | None = None
    lectura_actual: float | None = None
    es_promedio: bool | None = None

class LecturaTerminoMedioCreate(BaseModel):
    cliente_id: int
    periodo: str
    fecha_lectura: date