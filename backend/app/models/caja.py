from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Caja(Base):
    __tablename__ = "cajas"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    cajero_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    fecha_apertura = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    monto_inicial = Column(Float, nullable=False)

    fecha_cierre = Column(DateTime(timezone=True), nullable=True)
    monto_efectivo_esperado = Column(Float, nullable=True)
    observaciones_cierre = Column(String, nullable=True)

    estado = Column(String, nullable=False, default="abierta")

    fecha_arqueo = Column(DateTime(timezone=True), nullable=True)
    arqueado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    observaciones_arqueo = Column(String, nullable=True)

    cajero = relationship("Usuario", foreign_keys=[cajero_id])
    arqueado_por = relationship("Usuario", foreign_keys=[arqueado_por_id])