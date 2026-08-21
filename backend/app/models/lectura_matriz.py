from sqlalchemy import Column, Integer, Float, Date, String, UniqueConstraint
from app.core.database import Base 

class LecturaMatriz(Base):
    __tablename__ = "lectura_matriz"

    id = Column(Integer, primary_key=True, index=True)
    periodo = Column(String, nullable=False)
    fecha_lectura = Column(Date, nullable=False)
    lectura_actual = Column(Float, nullable=False)
    consumo_m3 = Column(Float, nullable=False)
    observaciones = Column(String, nullable=True)
    foto_ruta = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("periodo", name="uq_lectura_matriz_periodo"),
    )

    @property
    def tiene_foto(self) -> bool:
        return self.foto_ruta is not None