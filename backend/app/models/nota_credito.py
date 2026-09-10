# app/models/nota_credito.py

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class NotaCredito(Base):
    __tablename__ = "notas_credito"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)

    motivo = Column(Text, nullable=False)
    fecha_emision = Column(Date, nullable=False)

    anulado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # Campos reservados para integración SII (mismo patrón que Factura)
    folio_sii = Column(String, nullable=True)
    tipo_dte = Column(String, nullable=False, default="61")  # 61 = Nota de Crédito Electrónica
    tipo_dte_referencia = Column(String, nullable=False)  # tipo_dte de la factura que anula (snapshot)
    folio_referencia = Column(String, nullable=True)  # folio_sii de la factura que anula (snapshot)
    estado_envio_sii = Column(String, nullable=True)  # "pendiente" | "enviado" | "error"

    creado_en = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    empresa = relationship("Empresa")
    factura = relationship("Factura")
    anulado_por = relationship("Usuario")