from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles, empresa_id_o_error
from app.models.usuario import Usuario, RolUsuario
from app.schemas.configuracion import ConfiguracionResponse, ConfiguracionUpdate
from app.services import configuracion as configuracion_service
from app.services import certificado as certificado_service

router = APIRouter(prefix="/configuracion", tags=["configuracion"])


@router.post("/certificado")
def subir_certificado_sii(
    archivo: UploadFile = File(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    empresa_id = empresa_id_o_error(usuario)

    if not archivo.filename.endswith(".pfx"):
        raise HTTPException(status_code=400, detail="El archivo debe ser un .pfx")

    contenido = archivo.file.read()
    config = certificado_service.subir_certificado(db, empresa_id, contenido, password)
    return {"mensaje": "Certificado cargado correctamente", "certificado_pfx_path": config.certificado_pfx_path}


@router.get("/", response_model=ConfiguracionResponse)
def obtener_configuracion(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    empresa_id = empresa_id_o_error(usuario)
    return configuracion_service.obtener_configuracion(db, empresa_id)


@router.put("/", response_model=ConfiguracionResponse)
def actualizar_configuracion(
    datos: ConfiguracionUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    empresa_id = empresa_id_o_error(usuario)
    return configuracion_service.actualizar_configuracion(db, empresa_id, datos)