from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.usuario import Usuario, RolUsuario
from app.schemas.caja import (
    CajaAperturaCreate,
    CajaCierreCreate,
    CajaArqueoCreate,
    CajaResponse,
    CajaResumenResponse,
    DetalleCajaResponse,
    CajaConCajeroResponse
)
from app.services.caja import (
    abrir_caja,
    cerrar_caja,
    realizar_arqueo,
    obtener_caja_abierta,
    obtener_resumen_caja,
    listar_historial_cajas,
    construir_pdf_arqueo_caja,
    obtener_detalle_caja,
    listar_cajas_empresa
)

router = APIRouter(prefix="/cajas", tags=["cajas"])


@router.post("/abrir", response_model=CajaResponse)
def abrir(
    datos: CajaAperturaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return abrir_caja(db, current_user.id, current_user.empresa_id, datos.monto_inicial)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/abierta", response_model=CajaResponse | None)
def mi_caja_abierta(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    return obtener_caja_abierta(db, current_user.id, current_user.empresa_id)


@router.get("/historial", response_model=list[CajaResponse])
def historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Historial de cajas (abiertas y cerradas) del cajero logueado.
    """
    return listar_historial_cajas(db, current_user.id, current_user.empresa_id)

@router.get("/empresa", response_model=list[CajaConCajeroResponse])
def cajas_empresa(
    estado: str | None = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    """
    Lista todas las cajas de la empresa (de cualquier cajero). Solo admin.
    Filtro opcional ?estado=abierta o ?estado=cerrada.
    """
    cajas = listar_cajas_empresa(db, current_user.empresa_id, estado)
    return [
        CajaConCajeroResponse(
            **CajaResponse.model_validate(c).model_dump(),
            cajero_nombre=c.cajero.nombre,
        )
        for c in cajas
    ]


@router.get("/{caja_id}/detalle", response_model=DetalleCajaResponse)
def detalle(
    caja_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return obtener_detalle_caja(db, caja_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{caja_id}/cerrar", response_model=CajaResponse)
def cerrar(
    caja_id: int,
    datos: CajaCierreCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return cerrar_caja(
            db, caja_id, current_user, datos.observaciones_cierre,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{caja_id}/arqueo", response_model=CajaResponse)
def arquear(
    caja_id: int,
    datos: CajaArqueoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return realizar_arqueo(
            db, caja_id, current_user, datos.observaciones_arqueo,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{caja_id}/arqueo/pdf")
def descargar_pdf_arqueo(
    caja_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        buffer = construir_pdf_arqueo_caja(db, caja_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    filename = f"arqueo_caja_{caja_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.get("/{caja_id}/resumen", response_model=CajaResumenResponse)
def resumen(
    caja_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return obtener_resumen_caja(db, caja_id, current_user.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))