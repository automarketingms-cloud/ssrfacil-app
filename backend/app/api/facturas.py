from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi.responses import StreamingResponse

from app.core.database import get_db
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

router = APIRouter(prefix="/facturas", tags=["facturas"])


@router.post("/generar/{periodo}", response_model=ResumenGeneracionFacturas)
def generar_facturas_masivo(periodo: str, db: Session = Depends(get_db)):
    """
    Genera facturas para todos los clientes con lectura registrada en el
    periodo que aún no tengan factura. No falla si un cliente puntual
    tiene error: eso queda reflejado en 'fallidas' del resumen.
    """
    try:
        return generar_facturas_periodo(db, periodo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
  

@router.post("/generar/{cliente_id}/{periodo}", response_model=FacturaResponse)
def generar_factura_individual(cliente_id: int, periodo: str, db: Session = Depends(get_db)):
    """
    Genera la factura de un solo cliente para un periodo dado.
    """
    try:
        return generar_factura(db, cliente_id, periodo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[FacturaResponse])
def listar(
    periodo: str | None = None,
    cliente_id: int | None = None,
    estado: str | None = None,
    db: Session = Depends(get_db),
):
    actualizar_facturas_vencidas(db)
    facturas = listar_facturas(db, periodo=periodo, cliente_id=cliente_id, estado=estado)
    return [serializar_factura(f, db) for f in facturas]


@router.get("/{factura_id}", response_model=FacturaResponse)
def obtener(factura_id: int, db: Session = Depends(get_db)):
    try:
        factura = obtener_factura(db, factura_id)
        return serializar_factura(factura, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{factura_id}/pdf")
def descargar_factura_pdf(factura_id: int, db: Session = Depends(get_db)):
    try:
        buffer = construir_pdf_factura(factura_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    filename = f"factura_{factura_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )