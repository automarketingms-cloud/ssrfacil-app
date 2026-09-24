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
    # Auditoría de corrección del monto inicial (todo null si nunca se corrigió)
    monto_inicial_original = Column(Float, nullable=True)
    monto_inicial_editado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_edicion_monto_inicial = Column(DateTime(timezone=True), nullable=True)
    motivo_edicion_monto_inicial = Column(String, nullable=True)

    fecha_cierre = Column(DateTime(timezone=True), nullable=True)
    monto_efectivo_esperado = Column(Float, nullable=True)
    observaciones_cierre = Column(String, nullable=True)

    estado = Column(String, nullable=False, default="abierta")

    fecha_arqueo = Column(DateTime(timezone=True), nullable=True)
    arqueado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    observaciones_arqueo = Column(String, nullable=True)

    cajero = relationship("Usuario", foreign_keys=[cajero_id])
    arqueado_por = relationship("Usuario", foreign_keys=[arqueado_por_id])
    monto_inicial_editado_por = relationship("Usuario", foreign_keys=[monto_inicial_editado_por_id])

    
    @property
    def monto_inicial_editado_por_nombre(self) -> str | None:
        return self.monto_inicial_editado_por.nombre if self.monto_inicial_editado_por else None