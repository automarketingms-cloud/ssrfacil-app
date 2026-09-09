from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.configuracion import Configuracion
from app.services.storage import subir_archivo
from app.utils.crypto import encriptar

BUCKET_CERTIFICADOS = "certificados-sii"


def subir_certificado(db: Session, empresa_id: int, contenido_pfx: bytes, password: str) -> Configuracion:
    config = db.query(Configuracion).filter(Configuracion.empresa_id == empresa_id).first()
    if config is None:
        raise HTTPException(status_code=400, detail="La empresa no tiene configuración cargada")

    nombre_archivo = f"{empresa_id}/certificado.pfx"
    ruta = subir_archivo(BUCKET_CERTIFICADOS, contenido_pfx, nombre_archivo, "application/x-pkcs12")

    config.certificado_pfx_path = ruta
    config.certificado_password = encriptar(password)
    db.commit()
    db.refresh(config)
    return config