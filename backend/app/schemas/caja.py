from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class CajaAperturaCreate(BaseModel):
    monto_inicial: float


class CajaCierreCreate(BaseModel):
    observaciones_cierre: str | None = None


class CajaArqueoCreate(BaseModel):
    observaciones_arqueo: str | None = None


class CajaEditarMontoInicial(BaseModel):
    monto_inicial: float = Field(ge=0)
    motivo: str = Field(min_length=3, max_length=255)


class CajaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cajero_id: int | None = None
    fecha_apertura: datetime
    monto_inicial: float
    monto_inicial_original: float | None = None
    fecha_edicion_monto_inicial: datetime | None = None
    motivo_edicion_monto_inicial: str | None = None
    monto_inicial_editado_por_nombre: str | None = None
    fecha_cierre: datetime | None = None
    monto_efectivo_esperado: float | None = None
    observaciones_cierre: str | None = None
    estado: str
    fecha_arqueo: datetime | None = None
    arqueado_por_id: int | None = None
    observaciones_arqueo: str | None = None


class ResumenPorMetodo(BaseModel):
    metodo_pago: str
    cantidad: int
    total: float


class CajaResumenResponse(BaseModel):
    caja: CajaResponse
    resumen_por_metodo: list[ResumenPorMetodo]
    total_general: float

class DetallePagoArqueo(BaseModel):
    pago_id: int
    hora: datetime
    cliente_nombre: str
    cliente_rut: str
    periodo: str
    metodo_pago: str
    referencia: str | None = None
    monto: float


class DetalleCajaResponse(BaseModel):
    caja: CajaResponse
    pagos: list[DetallePagoArqueo]
    resumen_por_metodo: list[ResumenPorMetodo]
    total_general: float

class CajaConCajeroResponse(CajaResponse):
    cajero_nombre: str