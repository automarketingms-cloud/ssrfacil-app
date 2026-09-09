from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class CafSii(Base):
    __tablename__ = "caf_sii"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)

    tipo_dte = Column(String, nullable=False)  # ej. "39" boleta electrónica
    folio_desde = Column(Integer, nullable=False)
    folio_hasta = Column(Integer, nullable=False)
    folio_actual = Column(Integer, nullable=False)  # próximo folio a usar
    fecha_vencimiento = Column(Date, nullable=True)

    archivo_xml = Column(String, nullable=False)  # path en bucket privado Supabase
    activo = Column(Boolean, nullable=False, default=True)

    empresa = relationship("Empresa")

    __table_args__ = (
        UniqueConstraint(
            "empresa_id", "tipo_dte", "folio_desde", "folio_hasta",
            name="uq_caf_empresa_tipo_rango",
        ),
    )