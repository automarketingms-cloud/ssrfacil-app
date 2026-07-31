from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db  # ajusta el import según tu proyecto
from app.schemas.reclamo import (
    ReclamoCreate,
    ReclamoResponse,
    ReclamoResponder,
    ReclamoCerrarDirecto,
)
from app.services import reclamos as reclamos_service

router = APIRouter(prefix="/reclamos", tags=["Reclamos"])


@router.post("/", response_model=ReclamoResponse)
def crear_reclamo(datos: ReclamoCreate, db: Session = Depends(get_db)):
    try:
        return reclamos_service.crear_reclamo(db, datos)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[ReclamoResponse])
def listar_reclamos(
    periodo: Optional[str] = None,
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return reclamos_service.listar_reclamos(db, periodo=periodo, estado=estado, cliente_id=cliente_id)


@router.get("/{reclamo_id}", response_model=ReclamoResponse)
def obtener_reclamo(reclamo_id: int, db: Session = Depends(get_db)):
    reclamo = reclamos_service.obtener_reclamo(db, reclamo_id)
    if reclamo is None:
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
    return reclamo


@router.patch("/{reclamo_id}/responder", response_model=ReclamoResponse)
def responder_reclamo(reclamo_id: int, datos: ReclamoResponder, db: Session = Depends(get_db)):
    reclamo = reclamos_service.responder_reclamo(db, reclamo_id, datos)
    if reclamo is None:
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
    return reclamo


@router.patch("/{reclamo_id}/cerrar", response_model=ReclamoResponse)
def cerrar_reclamo(reclamo_id: int, db: Session = Depends(get_db)):
    try:
        reclamo = reclamos_service.cerrar_reclamo(db, reclamo_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if reclamo is None:
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
    return reclamo


@router.patch("/{reclamo_id}/cerrar-sin-respuesta", response_model=ReclamoResponse)
def cerrar_reclamo_sin_respuesta(
    reclamo_id: int, datos: ReclamoCerrarDirecto, db: Session = Depends(get_db)
):
    try:
        reclamo = reclamos_service.cerrar_reclamo_sin_respuesta(db, reclamo_id, datos.motivo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if reclamo is None:
        raise HTTPException(status_code=404, detail="Reclamo no encontrado")
    return reclamo