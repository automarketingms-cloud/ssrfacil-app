from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.caf_sii import CafSii

from datetime import datetime
from app.services.storage import subir_archivo, BUCKET_CAF_SII
from app.utils.caf_parser import parsear_caf


def obtener_caf_activo(db: Session, empresa_id: int, tipo_dte: str) -> CafSii | None:
    """Devuelve el CAF activo más antiguo con folios disponibles para ese tipo de documento.
    Bloquea la fila (SELECT FOR UPDATE) para evitar que dos envíos concurrentes
    tomen el mismo folio antes de que ninguno haga commit."""
    return (
        db.query(CafSii)
        .filter(
            CafSii.empresa_id == empresa_id,
            CafSii.tipo_dte == tipo_dte,
            CafSii.activo == True,  # noqa: E712
            CafSii.folio_actual <= CafSii.folio_hasta,
        )
        .order_by(CafSii.id.asc())
        .with_for_update()
        .first()
    )


def folios_restantes(caf: CafSii) -> int:
    return caf.folio_hasta - caf.folio_actual + 1


def tomar_folio(db: Session, empresa_id: int, tipo_dte: str) -> tuple[int, CafSii]:
    """
    Toma el próximo folio disponible del CAF activo y lo incrementa.
    Si el CAF se agota con este folio, se marca como inactivo automáticamente.
    """
    caf = obtener_caf_activo(db, empresa_id, tipo_dte)
    if caf is None:
        raise HTTPException(
            status_code=400,
            detail=f"No hay folios disponibles para el tipo de documento {tipo_dte}. Carga un nuevo CAF.",
        )

    folio = caf.folio_actual
    caf.folio_actual += 1
    if caf.folio_actual > caf.folio_hasta:
        caf.activo = False

    db.commit()
    db.refresh(caf)
    return folio, caf

def reservar_folio(db: Session, empresa_id: int, tipo_dte: str) -> tuple[int, CafSii]:
    """
    Igual que tomar_folio, pero NO hace commit. El caller es responsable
    de confirmar (commit) o descartar (rollback) la reserva según si el
    envío al SII tuvo éxito o no.
    """
    caf = obtener_caf_activo(db, empresa_id, tipo_dte)
    if caf is None:
        raise HTTPException(
            status_code=400,
            detail=f"No hay folios disponibles para el tipo de documento {tipo_dte}. Carga un nuevo CAF.",
        )

    folio = caf.folio_actual
    caf.folio_actual += 1
    if caf.folio_actual > caf.folio_hasta:
        caf.activo = False

    return folio, caf


def listar_cafs_por_agotarse(db: Session, empresa_id: int, umbral: int = 20) -> list[dict]:
    """Para el banner del Dashboard: CAFs activos con folios_restantes <= umbral."""
    cafs = (
        db.query(CafSii)
        .filter(CafSii.empresa_id == empresa_id, CafSii.activo == True)  # noqa: E712
        .all()
    )
    return [
        {
            "id": caf.id,
            "tipo_dte": caf.tipo_dte,
            "folios_restantes": folios_restantes(caf),
        }
        for caf in cafs
        if folios_restantes(caf) <= umbral
    ]


def subir_caf(db: Session, empresa_id: int, contenido: bytes, rut_empresa_esperado: str) -> CafSii:
    """
    Parsea el XML del CAF, valida que el RUT coincida con la empresa,
    lo sube a Storage y crea el registro en CafSii.
    """
    datos = parsear_caf(contenido)

    if datos["rut_emisor"].replace(".", "") != rut_empresa_esperado.replace(".", ""):
        raise HTTPException(
            status_code=400,
            detail=f"El CAF pertenece al RUT {datos['rut_emisor']}, no coincide con la empresa",
        )

    existe = (
        db.query(CafSii)
        .filter(
            CafSii.empresa_id == empresa_id,
            CafSii.tipo_dte == datos["tipo_dte"],
            CafSii.folio_desde == datos["folio_desde"],
            CafSii.folio_hasta == datos["folio_hasta"],
        )
        .first()
    )
    if existe:
        raise HTTPException(status_code=400, detail="Este CAF ya fue cargado anteriormente")

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    nombre_archivo = f"{empresa_id}/{datos['tipo_dte']}_{datos['folio_desde']}_{datos['folio_hasta']}_{timestamp}.xml"
    ruta = subir_archivo(BUCKET_CAF_SII, contenido, nombre_archivo, "application/xml")

    caf = CafSii(
        empresa_id=empresa_id,
        tipo_dte=datos["tipo_dte"],
        folio_desde=datos["folio_desde"],
        folio_hasta=datos["folio_hasta"],
        folio_actual=datos["folio_desde"],
        archivo_xml=ruta,
        activo=True,
    )
    db.add(caf)
    db.commit()
    db.refresh(caf)
    return caf