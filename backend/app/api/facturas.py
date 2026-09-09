from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.schemas.factura import FacturaResponse, ResumenGeneracionFacturas
from app.services.factura import (
    generar_factura,
    generar_facturas_periodo,
    obtener_factura,
    listar_facturas,
    actualizar_facturas_vencidas,
    serializar_factura,
    construir_pdf_factura
)
from app.services import sii as sii_service

router = APIRouter(prefix="/facturas", tags=["facturas"])


@router.post("/generar/{periodo}", response_model=ResumenGeneracionFacturas)
def generar_facturas_masivo(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return generar_facturas_periodo(db, periodo, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/generar/{cliente_id}/{periodo}", response_model=FacturaResponse)
def generar_factura_individual(
    cliente_id: int,
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        return generar_factura(db, cliente_id, periodo, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[FacturaResponse])
def listar(
    periodo: str | None = None,
    cliente_id: int | None = None,
    estado: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    actualizar_facturas_vencidas(db)
    facturas = listar_facturas(
        db, usuario.empresa_id, periodo=periodo, cliente_id=cliente_id, estado=estado
    )
    return [serializar_factura(f, db) for f in facturas]


@router.get("/{factura_id}", response_model=FacturaResponse)
def obtener(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        factura = obtener_factura(db, factura_id, usuario.empresa_id)
        return serializar_factura(factura, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{factura_id}/pdf")
def descargar_factura_pdf(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        buffer = construir_pdf_factura(factura_id, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"factura_{factura_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/{factura_id}/enviar-sii")
def enviar_factura_sii(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        factura = obtener_factura(db, factura_id, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if factura.estado_envio_sii == "enviado":
        raise HTTPException(status_code=400, detail="Esta factura ya fue enviada al SII")

    resultado = sii_service.enviar_boleta_sii(db, factura)
    return {
        "mensaje": "Boleta enviada correctamente al SII",
        "folio": factura.folio_sii,
        "respuesta_sii": resultado,
    }