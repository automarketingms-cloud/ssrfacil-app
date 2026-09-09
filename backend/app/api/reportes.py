from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.services.factura import (
    construir_reporte_facturacion,
    construir_excel_reporte_facturacion,
    construir_pdf_reporte_facturacion,
)
from app.services.presion import (
    construir_excel_reporte_presion,
    construir_pdf_reporte_presion,
)
from app.services.continuidad import (
    construir_reporte_continuidad,
    construir_excel_reporte_continuidad,
    construir_pdf_reporte_continuidad,
)
from app.services.reclamos import (
    construir_reporte_reclamos,
    construir_excel_reporte_reclamos,
    construir_pdf_reporte_reclamos,
)
from app.services.cliente import (
    construir_reporte_clientes_subsidio,
    construir_excel_reporte_clientes_subsidio,
)

from app.services.pago import (
    construir_reporte_pagos,
    construir_excel_reporte_pagos,
)


router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.get("/facturacion/{periodo}")
def reporte_facturacion(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Reporte de facturación con respaldo, por periodo, para fiscalización
    de la Superintendencia de Servicios Sanitarios (SISS).
    """
    try:
        return construir_reporte_facturacion(periodo, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/facturacion/{periodo}/excel")
def reporte_facturacion_excel(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        buffer = construir_excel_reporte_facturacion(periodo, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_facturacion_{periodo}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/facturacion/{periodo}/pdf")
def reporte_facturacion_pdf(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        buffer = construir_pdf_reporte_facturacion(periodo, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_facturacion_{periodo}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/presion/excel")
def reporte_presion_excel(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    buffer = construir_excel_reporte_presion(desde, hasta, db, usuario.empresa_id)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=reporte_presion.xlsx"},
    )


@router.get("/presion/pdf")
def reporte_presion_pdf(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    buffer = construir_pdf_reporte_presion(desde, hasta, db, usuario.empresa_id)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_presion.pdf"},
    )

@router.get("/continuidad/{periodo}")
def reporte_continuidad(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Reporte de continuidad de servicio (cortes y reposición), por periodo,
    para fiscalización de la Superintendencia de Servicios Sanitarios (SISS).
    """
    try:
        return construir_reporte_continuidad(periodo, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/continuidad/{periodo}/excel")
def reporte_continuidad_excel(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        buffer = construir_excel_reporte_continuidad(periodo, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_continuidad_{periodo}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/continuidad/{periodo}/pdf")
def reporte_continuidad_pdf(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    try:
        buffer = construir_pdf_reporte_continuidad(periodo, db, usuario.empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_continuidad_{periodo}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )



@router.get("/reclamos/{periodo}")
def reporte_reclamos_json(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    return construir_reporte_reclamos(db, periodo, usuario.empresa_id)


@router.get("/reclamos/{periodo}/excel")
def reporte_reclamos_excel(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    buffer = construir_excel_reporte_reclamos(periodo, db, usuario.empresa_id)
    filename = f"reporte_reclamos_{periodo}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reclamos/{periodo}/pdf")
def reporte_reclamos_pdf(
    periodo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    buffer = construir_pdf_reporte_reclamos(periodo, db, usuario.empresa_id)
    filename = f"reporte_reclamos_{periodo}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

@router.get("/clientes-subsidio")
def reporte_clientes_subsidio(
    solo_activos: bool = True,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Reporte interno de clientes con subsidio y su porcentaje de descuento.
    """
    return construir_reporte_clientes_subsidio(db, usuario.empresa_id, solo_activos)


@router.get("/clientes-subsidio/excel")
def reporte_clientes_subsidio_excel(
    solo_activos: bool = True,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    buffer = construir_excel_reporte_clientes_subsidio(db, usuario.empresa_id, solo_activos)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=reporte_clientes_subsidio.xlsx"},
    )


@router.get("/pagos")
def reporte_pagos(
    desde: date,
    hasta: date,
    cajero_id: Optional[int] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    """
    Reporte de pagos filtrado por rango de fechas y, opcionalmente, cajero.
    Solo admin.
    """
    return construir_reporte_pagos(db, usuario.empresa_id, desde, hasta, cajero_id)


@router.get("/pagos/excel")
def reporte_pagos_excel(
    desde: date,
    hasta: date,
    cajero_id: Optional[int] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    buffer = construir_excel_reporte_pagos(db, usuario.empresa_id, desde, hasta, cajero_id)
    filename = f"reporte_pagos_{desde}_{hasta}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )