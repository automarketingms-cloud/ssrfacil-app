from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.continuidad  import CorteCreate, CorteCierre, CorteResponse
from app.services import continuidad as continuidad_service
from app.models.continuidad import CorteContinuidad

router = APIRouter(prefix="/continuidad", tags=["Continuidad"])


@router.post("/", response_model=CorteResponse)
def abrir_corte(corte: CorteCreate, db: Session = Depends(get_db)):
    nuevo_corte = continuidad_service.crear_corte(db, corte)
    return continuidad_service.serializar_corte(nuevo_corte)


@router.patch("/{corte_id}/cerrar", response_model=CorteResponse)
def cerrar_corte(corte_id: int, cierre: CorteCierre, db: Session = Depends(get_db)):
    try:
        corte = continuidad_service.cerrar_corte(db, corte_id, cierre)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    return continuidad_service.serializar_corte(corte)


@router.get("/", response_model=list[CorteResponse])
def listar_cortes(periodo: str = None, solo_abiertos: bool = False, db: Session = Depends(get_db)):
    cortes = continuidad_service.listar_cortes(db, periodo=periodo, solo_abiertos=solo_abiertos)
    return [continuidad_service.serializar_corte(c) for c in cortes]


@router.get("/{corte_id}", response_model=CorteResponse)
def obtener_corte(corte_id: int, db: Session = Depends(get_db)):
    corte = db.query(db.query(CorteContinuidad)).filter(
        db.query(CorteContinuidad).id == corte_id
    ).first()
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    return continuidad_service.serializar_corte(corte)