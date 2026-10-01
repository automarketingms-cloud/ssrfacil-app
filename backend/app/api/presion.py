from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.presion import MedicionPresionCreate, MedicionPresionUpdate
from app.schemas.historial import HistorialEdicionResponse
from app.services.presion import serializar_medicion, obtener_mediciones, crear_medicion
from app.services import presion as presion_service
from app.services import historial as historial_service

router = APIRouter(prefix="/presion", tags=["Presión"])


@router.post("/")
def registrar_medicion(
    datos: MedicionPresionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        medicion = crear_medicion(db, datos, current_user.empresa_id, current_user.id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return serializar_medicion(medicion)


@router.get("/")
def listar_mediciones(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    limit: Optional[int] = Query(default=None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    mediciones = obtener_mediciones(desde, hasta, db, current_user.empresa_id, limit)
    return [serializar_medicion(m) for m in mediciones]



@router.get("/{medicion_id}")
def obtener_medicion(
    medicion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    medicion = presion_service.obtener_medicion(db, medicion_id, current_user.empresa_id)
    if medicion is None:
        raise HTTPException(status_code=404, detail="Medición no encontrada")
    return serializar_medicion(medicion)


@router.patch("/{medicion_id}")
def editar_medicion(
    medicion_id: int,
    datos: MedicionPresionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        medicion = presion_service.editar_medicion(db, medicion_id, datos, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if medicion is None:
        raise HTTPException(status_code=404, detail="Medición no encontrada")
    return serializar_medicion(medicion)


@router.get("/{medicion_id}/historial", response_model=list[HistorialEdicionResponse])
def historial_medicion(
    medicion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    medicion = presion_service.obtener_medicion(db, medicion_id, current_user.empresa_id)
    if medicion is None:
        raise HTTPException(status_code=404, detail="Medición no encontrada")
    return historial_service.listar_historial(
        db, current_user.empresa_id, "medicion_presion", medicion_id
    )