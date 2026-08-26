# app/models/usuario.py
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class RolUsuario(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    OFICINA = "oficina"
    TERRENO = "terreno"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True, index=True)  # nullable: super_admin no tiene empresa
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(SAEnum(RolUsuario), nullable=False, default=RolUsuario.TERRENO)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    empresa = relationship("Empresa")