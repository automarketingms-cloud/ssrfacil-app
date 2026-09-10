from sqlalchemy import Column, Integer, String, Boolean, Date, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    nombre = Column(String, nullable=False)
    rut = Column(String, nullable=False)
    direccion = Column(String, nullable=True)
    numero_medidor = Column(String, nullable=False)
    fecha_ingreso = Column(Date, nullable=True)
    activo = Column(Boolean, default=True)
    es_socio = Column(Boolean, default=True)

    tiene_subsidio = Column(Boolean, default=False, nullable=False)
    porcentaje_subsidio = Column(Float, default=0.0, nullable=False)
    credito_m3 = Column(Float, default=0.0, nullable=False)

    # --- Nuevo: datos para emisión de documentos SII ---
    tipo_cliente = Column(String, nullable=True)  # "persona_natural" | "persona_juridica"
    giro = Column(String, nullable=True)          # obligatorio solo para Factura (33/34)
    comuna = Column(String, nullable=True)

    empresa = relationship("Empresa")

    __table_args__ = (
        UniqueConstraint("empresa_id", "rut", name="uq_cliente_empresa_rut"),
        UniqueConstraint("empresa_id", "numero_medidor", name="uq_cliente_empresa_numero_medidor"),
    )