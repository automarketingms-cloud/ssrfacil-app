from sqlalchemy import Column, Integer, Float, Date, ForeignKey, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lectura(Base):
    __tablename__ = "lecturas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    fecha_lectura = Column(Date, nullable=False)
    periodo = Column(String, nullable=False)  # formato "2026-07" (año-mes)
    lectura_actual = Column(Float, nullable=False)
    es_promedio = Column(Boolean, nullable=False, default=False)

    cliente = relationship("Cliente", backref="lecturas")