from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.core.database import Base

class CorteContinuidad(Base):
    __tablename__ = "cortes_continuidad"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    fecha_hora_inicio = Column(DateTime, nullable=False)
    fecha_hora_termino = Column(DateTime, nullable=True)  # null mientras el corte sigue abierto
    tipo = Column(String(20), nullable=False)  # 'programado' | 'no_programado'
    causa = Column(String(255), nullable=False)
    sector_afectado = Column(String(255), nullable=False)
    clientes_afectados = Column(Integer, nullable=True)
    observaciones = Column(String, nullable=True)