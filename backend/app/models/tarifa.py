from sqlalchemy import Column, Integer, Float, Date, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tarifa(Base):
    __tablename__ = "tarifas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)          # ej: "Tarifa 2026"
    cargo_fijo = Column(Float, nullable=False)        # monto fijo mensual
    valor_fondo_reposicion = Column(Float, nullable=False, default=0)  # $/m3
    vigente_desde = Column(Date, nullable=False)

    tramos = relationship(
        "TarifaTramo",
        back_populates="tarifa",
        cascade="all, delete-orphan",
        order_by="TarifaTramo.numero_tramo",
    )


class TarifaTramo(Base):
    __tablename__ = "tarifa_tramos"

    id = Column(Integer, primary_key=True, index=True)
    tarifa_id = Column(Integer, ForeignKey("tarifas.id"), nullable=False)
    numero_tramo = Column(Integer, nullable=False)    # 1, 2, 3...
    desde_m3 = Column(Float, nullable=False)          # inclusive
    hasta_m3 = Column(Float, nullable=True)           # inclusive; None = sin limite (ultimo tramo)
    precio_m3 = Column(Float, nullable=False)

    tarifa = relationship("Tarifa", back_populates="tramos")