from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, empresa_id_o_error
from app.models.usuario import Usuario, RolUsuario
from app.models.configuracion import Configuracion
from app.models.caf_sii import CafSii
from app.services import caf as caf_service

router = APIRouter(prefix="/caf", tags=["CAF SII"])


@router.post("/")
def subir_caf(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    empresa_id = empresa_id_o_error(usuario)

    if not archivo.filename.endswith(".xml"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un XML")

    contenido = archivo.file.read()

    config = (
        db.query(Configuracion)
        .filter(Configuracion.empresa_id == empresa_id)
        .first()
    )
    if config is None or not config.rut_empresa:
        raise HTTPException(status_code=400, detail="La empresa no tiene RUT configurado")

    caf = caf_service.subir_caf(db, empresa_id, contenido, config.rut_empresa)
    return {
        "mensaje": "CAF cargado correctamente",
        "tipo_dte": caf.tipo_dte,
        "folio_desde": caf.folio_desde,
        "folio_hasta": caf.folio_hasta,
    }


@router.get("/")
def listar_cafs(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    empresa_id = empresa_id_o_error(usuario)
    cafs = (
        db.query(CafSii)
        .filter(CafSii.empresa_id == empresa_id)
        .order_by(CafSii.id.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "tipo_dte": c.tipo_dte,
            "folio_desde": c.folio_desde,
            "folio_hasta": c.folio_hasta,
            "folio_actual": c.folio_actual,
            "folios_restantes": caf_service.folios_restantes(c),
            "activo": c.activo,
            "fecha_vencimiento": c.fecha_vencimiento,
        }
        for c in cafs
    ]


@router.get("/alertas")
def obtener_alertas_folios(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """Para el banner del Dashboard."""
    empresa_id = empresa_id_o_error(usuario)
    return caf_service.listar_cafs_por_agotarse(db, empresa_id)