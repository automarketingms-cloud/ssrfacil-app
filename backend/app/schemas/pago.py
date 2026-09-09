from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, field_validator

METODOS_VALIDOS = {"efectivo", "tarjeta_debito", "tarjeta_credito", "transferencia"}
METODOS_QUE_REQUIEREN_REFERENCIA = {"tarjeta_debito", "tarjeta_credito", "transferencia"}


class PagoCreate(BaseModel):
    factura_id: int
    monto: float
    fecha_pago: date
    metodo_pago: str
    referencia: str | None = None
    observaciones: str | None = None

    @field_validator("metodo_pago")
    @classmethod
    def validar_metodo(cls, v: str) -> str:
        if v not in METODOS_VALIDOS:
            raise ValueError(f"Método de pago inválido: {v}")
        return v

    @field_validator("referencia")
    @classmethod
    def validar_referencia(cls, v: str | None, info) -> str | None:
        metodo = info.data.get("metodo_pago")
        if metodo in METODOS_QUE_REQUIEREN_REFERENCIA and not v:
            campo = "voucher" if metodo in ("tarjeta_debito", "tarjeta_credito") else "número de transacción"
            raise ValueError(f"Debes ingresar el {campo} para este medio de pago")
        return v


class PagoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    factura_id: int
    monto: float
    fecha_pago: date
    metodo_pago: str
    referencia: str | None = None
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
    referencia: str | None = None
    observaciones: str | None = None

class PagoDelDiaResponse(BaseModel):
    pago_id: int
    factura_id: int
    periodo: str
    cliente_nombre: str
    cajero_nombre: str
    cajero_id: int
    monto: float
    fecha_pago: date
    metodo_pago: str
    referencia: str | None = None
    observaciones: str | None = None