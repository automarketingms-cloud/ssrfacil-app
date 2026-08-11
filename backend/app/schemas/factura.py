from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

class FacturaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int
    nombre_cliente: str | None = None
    periodo: str
    tipo_facturacion: str

    lectura_anterior: float
    lectura_actual: float
    consumo_m3: float
    detalle_tramos: list[dict] | None = None
    fecha_lectura_anterior: date | None = None
    fecha_lectura_actual: date | None = None
    valor_fondo_reposicion: float

    cargo_fijo: float
    monto_variable: float
    cargo_fondo_reposicion: float
    subsidio_aplicado: float
    porcentaje_subsidio_aplicado: float | None = None
    iva: float
    iva: float
    saldo_anterior: float
    interes_mora: float
    mensaje_boleta: str | None = None
    fecha_limite_corte: date | None = None
    total_a_pagar: float

    fecha_emision: date
    fecha_vencimiento: date
    estado: str

    folio_sii: str | None = None
    tipo_dte: str | None = None
    estado_envio_sii: str | None = None
    url_pdf_sii: str | None = None

    creado_en: datetime


class FacturaFallida(BaseModel):
    cliente_id: int
    motivo: str


class ResumenGeneracionFacturas(BaseModel):
    periodo: str
    generadas: list[FacturaResponse]
    cantidad_generadas: int
    fallidas: list[FacturaFallida]
    cantidad_fallidas: int