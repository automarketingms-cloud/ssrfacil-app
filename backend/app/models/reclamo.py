from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Reclamo(Base):
    __tablename__ = "reclamos"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)

    folio = Column(String, index=True, nullable=False)  # ej "2026-001", único por empresa
    anio = Column(Integer, nullable=False)

    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    nombre_reclamante = Column(String, nullable=True)
    rut_reclamante = Column(String, nullable=True)
    direccion_reclamo = Column(String, nullable=True)

    tipo_reclamo = Column(String, nullable=False)
    descripcion = Column(Text, nullable=False)

    fecha_recepcion = Column(DateTime, nullable=False)
    plazo_vencimiento = Column(Date, nullable=False)

    estado = Column(String, nullable=False, default="abierto")  # abierto | respondido | cerrado

    fecha_respuesta = Column(DateTime, nullable=True)
    respuesta = Column(Text, nullable=True)
    dias_habiles_respuesta = Column(Integer, nullable=True)
    fuera_de_plazo = Column(Boolean, nullable=True)

    motivo_cierre = Column(String, nullable=True)

    observaciones = Column(Text, nullable=True)

    cliente = relationship("Cliente")

    __table_args__ = (
        UniqueConstraint("empresa_id", "folio", name="uq_reclamos_empresa_folio"),
    )