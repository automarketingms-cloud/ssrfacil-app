from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class HistorialEdicion(Base):
    """Auditoría genérica de ediciones: una fila por cada vez que se guardan cambios."""
    __tablename__ = "historial_ediciones"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)

    entidad = Column(String, nullable=False)       # "reclamo", "medicion_presion", ...
    entidad_id = Column(Integer, nullable=False)   # sin FK: apunta a tablas distintas según entidad

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(DateTime(timezone=True), nullable=False)

    # {"campo": {"antes": ..., "despues": ...}} — solo los campos que cambiaron
    cambios = Column(JSONB, nullable=False)

    usuario = relationship("Usuario")

    __table_args__ = (
        Index("ix_historial_entidad", "empresa_id", "entidad", "entidad_id"),
    )

    @property
    def usuario_nombre(self):
        return self.usuario.nombre if self.usuario else None