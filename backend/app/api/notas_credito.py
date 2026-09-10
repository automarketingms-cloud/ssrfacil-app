from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.schemas.nota_credito import AnularFacturaRequest, NotaCreditoResponse
from app.services.nota_credito import (
    anular_factura,
    obtener_nota_credito,
    listar_notas_credito,
    serializar_nota_credito,
)

router = APIRouter(prefix="/notas-credito", tags=["notas-credito"])


@router.post("/anular/{factura_id}", response_model=NotaCreditoResponse)
def anular_factura_endpoint(
    factura_id: int,
    payload: AnularFacturaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    try:
        nota = anular_factura(db, factura_id, payload.motivo, usuario, usuario.empresa_id)
        return serializar_nota_credito(nota)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[NotaCreditoResponse])
def listar(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    notas = listar_notas_credito(db, usuario.empresa_id)
    return [serializar_nota_credito(n) for n in notas]


@router.get("/{nota_credito_id}", response_model=NotaCreditoResponse)
def obtener(
    nota_credito_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    try:
        nota = obtener_nota_credito(db, nota_credito_id, usuario.empresa_id)
        return serializar_nota_credito(nota)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))