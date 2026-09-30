from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.utils.fechas import ahora


class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    caja_id = Column(Integer, ForeignKey("cajas.id"), nullable=False)  # NUEVO

    monto = Column(Float, nullable=False)
    fecha_pago = Column(Date, nullable=False)
    metodo_pago = Column(String, nullable=False)
    referencia = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)

    creado_en = Column(DateTime(timezone=True), default=ahora)

    factura = relationship("Factura")
    caja = relationship("Caja")  # NUEVO