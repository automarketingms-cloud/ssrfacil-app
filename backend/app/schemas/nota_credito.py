from pydantic import BaseModel, Field
from datetime import date, datetime


class AnularFacturaRequest(BaseModel):
    motivo: str = Field(..., min_length=1)


class NotaCreditoResponse(BaseModel):
    id: int
    empresa_id: int
    factura_id: int
    motivo: str
    fecha_emision: date
    anulado_por_id: int
    tipo_dte: str
    tipo_dte_referencia: str
    folio_referencia: str | None
    folio_sii: str | None
    estado_envio_sii: str | None
    creado_en: datetime

    class Config:
        from_attributes = True