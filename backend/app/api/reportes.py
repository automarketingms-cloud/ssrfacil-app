from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.services.factura import (
    construir_reporte_facturacion,
    construir_excel_reporte_facturacion,
    construir_pdf_reporte_facturacion,
)
from app.services.presion import (
    serializar_medicion,
    obtener_mediciones,
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


router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.get("/facturacion/{periodo}")
def reporte_facturacion(periodo: str, db: Session = Depends(get_db)):
    """
    Reporte de facturación con respaldo, por periodo, para fiscalización
    de la Superintendencia de Servicios Sanitarios (SISS).
    """
    try:
        return construir_reporte_facturacion(periodo, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/facturacion/{periodo}/excel")
def reporte_facturacion_excel(periodo: str, db: Session = Depends(get_db)):
    try:
        buffer = construir_excel_reporte_facturacion(periodo, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_facturacion_{periodo}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/facturacion/{periodo}/pdf")
def reporte_facturacion_pdf(periodo: str, db: Session = Depends(get_db)):
    try:
        buffer = construir_pdf_reporte_facturacion(periodo, db)
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
):
    buffer = construir_excel_reporte_presion(desde, hasta, db)
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
):
    buffer = construir_pdf_reporte_presion(desde, hasta, db)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_presion.pdf"},
    )

@router.get("/continuidad/{periodo}")
def reporte_continuidad(periodo: str, db: Session = Depends(get_db)):
    """
    Reporte de continuidad de servicio (cortes y reposición), por periodo,
    para fiscalización de la Superintendencia de Servicios Sanitarios (SISS).
    """
    try:
        return construir_reporte_continuidad(periodo, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/continuidad/{periodo}/excel")
def reporte_continuidad_excel(periodo: str, db: Session = Depends(get_db)):
    try:
        buffer = construir_excel_reporte_continuidad(periodo, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_continuidad_{periodo}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/continuidad/{periodo}/pdf")
def reporte_continuidad_pdf(periodo: str, db: Session = Depends(get_db)):
    try:
        buffer = construir_pdf_reporte_continuidad(periodo, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"reporte_continuidad_{periodo}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )



@router.get("/reclamos/{periodo}")
def reporte_reclamos_json(periodo: str, db: Session = Depends(get_db)):
    return construir_reporte_reclamos(db, periodo)


@router.get("/reclamos/{periodo}/excel")
def reporte_reclamos_excel(periodo: str, db: Session = Depends(get_db)):
    buffer = construir_excel_reporte_reclamos(periodo, db)
    filename = f"reporte_reclamos_{periodo}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reclamos/{periodo}/pdf")
def reporte_reclamos_pdf(periodo: str, db: Session = Depends(get_db)):
    buffer = construir_pdf_reporte_reclamos(periodo, db)
    filename = f"reporte_reclamos_{periodo}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )