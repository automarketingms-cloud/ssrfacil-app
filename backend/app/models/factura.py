from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Text,
    JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    periodo = Column(String, nullable=False)  # ej. "2026-08"
    tipo_facturacion = Column(String, nullable=False, default="normal")
    # valores: "normal" | "termino_medio"

    # Snapshot del cálculo al momento de emitir (no recalcular después,
    # aunque cambien tarifas o el cliente deje de tener subsidio)
    cargo_fijo = Column(Float, nullable=False)
    monto_variable = Column(Float, nullable=False)
    lectura_anterior = Column(Float, nullable=False, default=0)
    lectura_actual = Column(Float, nullable=False, default=0)
    consumo_m3 = Column(Float, nullable=False, default=0)
    detalle_tramos = Column(JSON, nullable=True)
    fecha_lectura_anterior = Column(Date, nullable=True)
    fecha_lectura_actual = Column(Date, nullable=True)
    valor_fondo_reposicion = Column(Float, nullable=False, default=0)
    cargo_fondo_reposicion = Column(Float, nullable=False, default=0)
    subsidio_aplicado = Column(Float, nullable=False, default=0)
    porcentaje_subsidio_aplicado = Column(Float, nullable=True)
    iva = Column(Float, nullable=False, default=0)

    # Deuda arrastrada de facturas anteriores impagas, e interés moratorio
    # calculado solo sobre la porción vencida de esa deuda (snapshot al emitir)
    saldo_anterior = Column(Float, nullable=False, default=0)
    interes_mora = Column(Float, nullable=False, default=0)

    total_a_pagar = Column(Float, nullable=False)

    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    mensaje_boleta = Column(Text, nullable=True)
    fecha_limite_corte = Column(Date, nullable=True)
    
    
    # Estado de pago (se actualiza cuando llega un Pago asociado)
    estado = Column(String, nullable=False, default="pendiente")
    # valores: "pendiente" | "parcial" | "pagada" | "vencida"
    

    # Campos reservados para integración SII vía SimpleAPI (más adelante)
    folio_sii = Column(String, nullable=True)
    tipo_dte = Column(String, nullable=True)  # ej. "39" boleta electrónica
    estado_envio_sii = Column(String, nullable=True)  # "pendiente" | "enviado" | "error"
    url_pdf_sii = Column(String, nullable=True)

    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cliente = relationship("Cliente")

    __table_args__ = (
        UniqueConstraint("cliente_id", "periodo", name="uq_factura_cliente_periodo"),
    )