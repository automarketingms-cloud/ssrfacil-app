from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.presion import MedicionPresion

# Rango vigente: NCh 691:2015, DS MOP N°7 y N°14 de 2016 (15 a 70 mca)
# Rango anterior: según criterio interno indicado (8 a 40 mca antes de 2020)
# Si tienes el decreto exacto de este rango anterior, ajusta la fecha de corte.
FECHA_CAMBIO_NORMA = date(2020, 1, 1)
RANGO_ANTERIOR = (8, 40)
RANGO_VIGENTE = (15, 70)


def obtener_rango_normativo(fecha_medicion: date) -> tuple[float, float]:
    if fecha_medicion < FECHA_CAMBIO_NORMA:
        return RANGO_ANTERIOR
    return RANGO_VIGENTE


def evaluar_cumplimiento(presion_mca: float, fecha_medicion: date) -> dict:
    minimo, maximo = obtener_rango_normativo(fecha_medicion)
    return {
        "rango_minimo": minimo,
        "rango_maximo": maximo,
        "cumple": minimo <= presion_mca <= maximo,
    }


def serializar_medicion(m: MedicionPresion) -> dict:
    evaluacion = evaluar_cumplimiento(float(m.presion_mca), m.fecha_medicion)
    return {
        "id": m.id,
        "punto_medicion": m.punto_medicion,
        "ubicacion": m.ubicacion,
        "fecha_medicion": m.fecha_medicion,
        "hora_medicion": m.hora_medicion,
        "presion_mca": float(m.presion_mca),
        "observaciones": m.observaciones,
        **evaluacion,
    }


def obtener_mediciones(desde: Optional[date], hasta: Optional[date], db: Session):
    query = db.query(MedicionPresion)
    if desde:
        query = query.filter(MedicionPresion.fecha_medicion >= desde)
    if hasta:
        query = query.filter(MedicionPresion.fecha_medicion <= hasta)
    return query.order_by(MedicionPresion.fecha_medicion.desc()).all()