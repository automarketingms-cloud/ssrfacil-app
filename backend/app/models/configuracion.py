# app/models/configuracion.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Configuracion(Base):
    __tablename__ = "configuracion"

    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)

    # Datos de la empresa/APR
    nombre_empresa = Column(String, nullable=True)
    rut_empresa = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    horario_atencion = Column(String, nullable=True)
    email = Column(String, nullable=True)
    giro = Column(String, nullable=True)

    # Configuración de facturación
    dias_plazo_pago = Column(Integer, nullable=False, default=30)
    dia_facturacion = Column(Integer, nullable=False, default=20)

    # Tasa de interés corriente (CMF), anual, en %. Ej: 27.04 = 27.04% anual.
    # Se actualiza manualmente cuando la CMF publica un nuevo valor mensual.
    tasa_interes_mora = Column(Float, nullable=False, default=0)
    tasa_iva = Column(Float, nullable=False, default=19.0)

    numero_medidor_matriz = Column(String, nullable=True)

    empresa = relationship("Empresa")