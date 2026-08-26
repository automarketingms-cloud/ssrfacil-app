from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    rut = Column(String, unique=True, nullable=True)
    activa = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))