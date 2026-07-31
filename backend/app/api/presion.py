from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.presion import MedicionPresion
from app.schemas.presion import MedicionPresionCreate
from app.services.presion import serializar_medicion, obtener_mediciones

router = APIRouter(prefix="/presion", tags=["Presión"])


@router.post("/")
def registrar_medicion(datos: MedicionPresionCreate, db: Session = Depends(get_db)):
    medicion = MedicionPresion(**datos.model_dump())
    db.add(medicion)
    db.commit()
    db.refresh(medicion)
    return serializar_medicion(medicion)


@router.get("/")
def listar_mediciones(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
):
    mediciones = obtener_mediciones(desde, hasta, db)
    return [serializar_medicion(m) for m in mediciones]