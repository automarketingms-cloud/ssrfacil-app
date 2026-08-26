from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.schemas.configuracion import ConfiguracionResponse, ConfiguracionUpdate
from app.services import configuracion as configuracion_service

router = APIRouter(prefix="/configuracion", tags=["configuracion"])


def _empresa_id_o_error(usuario: Usuario) -> int:
    if usuario.empresa_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuario no pertenece a ninguna empresa",
        )
    return usuario.empresa_id


@router.get("/", response_model=ConfiguracionResponse)
def obtener_configuracion(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    empresa_id = _empresa_id_o_error(usuario)
    return configuracion_service.obtener_configuracion(db, empresa_id)


@router.put("/", response_model=ConfiguracionResponse)
def actualizar_configuracion(
    datos: ConfiguracionUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    empresa_id = _empresa_id_o_error(usuario)
    return configuracion_service.actualizar_configuracion(db, empresa_id, datos)