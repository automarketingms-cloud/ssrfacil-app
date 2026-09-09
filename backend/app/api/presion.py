from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.models.presion import MedicionPresion
from app.models.reclamo import Reclamo
from app.schemas.presion import MedicionPresionCreate
from app.services.presion import serializar_medicion, obtener_mediciones

router = APIRouter(prefix="/presion", tags=["Presión"])


@router.post("/")
def registrar_medicion(
    datos: MedicionPresionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cliente_id = None
    if datos.reclamo_id is not None:
        reclamo = (
            db.query(Reclamo)
            .filter(Reclamo.id == datos.reclamo_id, Reclamo.empresa_id == current_user.empresa_id)
            .first()
        )
        if not reclamo:
            raise HTTPException(status_code=404, detail="Reclamo no encontrado")
        cliente_id = reclamo.cliente_id  # puede ser None si el reclamo no tiene cliente asociado

    medicion = MedicionPresion(
        empresa_id=current_user.empresa_id,
        cliente_id=cliente_id,
        **datos.model_dump(),
    )
    db.add(medicion)
    db.commit()
    db.refresh(medicion)
    return serializar_medicion(medicion)


@router.get("/")
def listar_mediciones(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    mediciones = obtener_mediciones(desde, hasta, db, current_user.empresa_id)
    return [serializar_medicion(m) for m in mediciones]