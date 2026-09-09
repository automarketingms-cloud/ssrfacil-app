from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.usuario import Usuario, RolUsuario
from app.schemas.continuidad import CorteCreate, CorteCierre, CorteResponse
from app.services import continuidad as continuidad_service
from app.models.continuidad import CorteContinuidad

router = APIRouter(prefix="/continuidad", tags=["Continuidad"])


@router.post("/", response_model=CorteResponse)
def abrir_corte(
    corte: CorteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    nuevo_corte = continuidad_service.crear_corte(db, corte, current_user.empresa_id)
    return continuidad_service.serializar_corte(nuevo_corte)


@router.patch("/{corte_id}/cerrar", response_model=CorteResponse)
def cerrar_corte(
    corte_id: int,
    cierre: CorteCierre,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        corte = continuidad_service.cerrar_corte(db, corte_id, cierre, current_user.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    return continuidad_service.serializar_corte(corte)


@router.get("/", response_model=list[CorteResponse])
def listar_cortes(
    periodo: str = None,
    solo_abiertos: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cortes = continuidad_service.listar_cortes(db, current_user.empresa_id, periodo=periodo, solo_abiertos=solo_abiertos)
    return [continuidad_service.serializar_corte(c) for c in cortes]


@router.get("/{corte_id}", response_model=CorteResponse)
def obtener_corte(
    corte_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    corte = (
        db.query(CorteContinuidad)
        .filter(CorteContinuidad.id == corte_id, CorteContinuidad.empresa_id == current_user.empresa_id)
        .first()
    )
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    return continuidad_service.serializar_corte(corte)