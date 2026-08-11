from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.pago import PagoCreate, PagoResponse, FacturaPendienteResponse, HistorialPagoResponse
from app.services.pago import registrar_pago, listar_facturas_pendientes_cliente, listar_pagos_cliente

router = APIRouter(prefix="/pagos", tags=["pagos"])


@router.post("/", response_model=PagoResponse)
def crear_pago(pago: PagoCreate, db: Session = Depends(get_db)):
    """
    Registra un pago (total o parcial) sobre una factura específica,
    elegida por el cajero.
    """
    try:
        return registrar_pago(
            db,
            factura_id=pago.factura_id,
            monto=pago.monto,
            fecha_pago=pago.fecha_pago,
            metodo_pago=pago.metodo_pago,
            observaciones=pago.observaciones,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pendientes/{cliente_id}", response_model=list[FacturaPendienteResponse])
def facturas_pendientes(cliente_id: int, db: Session = Depends(get_db)):
    """
    Lista las facturas con saldo pendiente de un cliente (pendiente,
    parcial o vencida), de la más atrasada a la más reciente, para que
    el cajero elija a cuál abonar.
    """
    return listar_facturas_pendientes_cliente(db, cliente_id)


@router.get("/historial/{cliente_id}", response_model=list[HistorialPagoResponse])
def historial_pagos(cliente_id: int, db: Session = Depends(get_db)):
    """
    Lista el historial completo de pagos de un cliente, del más reciente
    al más antiguo.
    """
    return listar_pagos_cliente(db, cliente_id)