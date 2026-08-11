from sqlalchemy import Column, Integer, String, Boolean, Date, Float
from app.core.database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    rut = Column(String, unique=True, nullable=False)
    direccion = Column(String, nullable=True)
    numero_medidor = Column(String, unique=True, nullable=False)
    fecha_ingreso = Column(Date, nullable=True)
    activo = Column(Boolean, default=True)
    es_socio = Column(Boolean, default=True)

    tiene_subsidio = Column(Boolean, default=False, nullable=False)
    porcentaje_subsidio = Column(Float, default=0.0, nullable=False)  # ej: 0.5 = 50%
    credito_m3 = Column(Float, default=0.0, nullable=False)