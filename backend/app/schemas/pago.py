from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class PagoCreate(BaseModel):
    factura_id: int
    monto: float
    fecha_pago: date
    metodo_pago: str
    observaciones: str | None = None


class PagoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    factura_id: int
    monto: float
    fecha_pago: date
    metodo_pago: str
    observaciones: str | None = None
    creado_en: datetime


class FacturaPendienteResponse(BaseModel):
    factura_id: int
    periodo: str
    fecha_emision: date
    fecha_vencimiento: date
    total_a_pagar: float
    saldo: float
    estado: str

class HistorialPagoResponse(BaseModel):
    pago_id: int
    factura_id: int
    periodo: str
    monto: float
    fecha_pago: date
    metodo_pago: str
    observaciones: str | None = None