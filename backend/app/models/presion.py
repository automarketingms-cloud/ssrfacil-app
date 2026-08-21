from sqlalchemy import Column, Integer, String, Date, Time, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MedicionPresion(Base):
    __tablename__ = "mediciones_presion"

    id = Column(Integer, primary_key=True, index=True)
    punto_medicion = Column(String, nullable=False)
    ubicacion = Column(String, nullable=True)
    fecha_medicion = Column(Date, nullable=False)
    hora_medicion = Column(Time, nullable=True)
    presion_mca = Column(Numeric, nullable=False)
    observaciones = Column(Text, nullable=True)
    reclamo_id = Column(Integer, ForeignKey("reclamos.id"), nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    reclamo = relationship("Reclamo")