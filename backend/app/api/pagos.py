from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.schemas.pago import PagoCreate, PagoResponse, FacturaPendienteResponse, HistorialPagoResponse
from app.services.pago import registrar_pago, listar_facturas_pendientes_cliente, listar_pagos_cliente

from datetime import date
from app.schemas.pago import PagoDelDiaResponse
from app.services.pago import listar_pagos_del_dia

router = APIRouter(prefix="/pagos", tags=["pagos"])


@router.post("/", response_model=PagoResponse)
def crear_pago(
    pago: PagoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
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
    referencia=pago.referencia,   # NUEVO
    observaciones=pago.observaciones,
    empresa_id=current_user.empresa_id,
    cajero_id=current_user.id,
)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dia", response_model=list[PagoDelDiaResponse])
def pagos_del_dia(
    fecha: date | None = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Lista los pagos registrados en una fecha (por defecto, hoy) de la
    empresa del usuario logueado.
    """
    fecha_consulta = fecha or date.today()
    return listar_pagos_del_dia(db, current_user.empresa_id, fecha_consulta)


@router.get("/pendientes/{cliente_id}", response_model=list[FacturaPendienteResponse])
def facturas_pendientes(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Lista las facturas con saldo pendiente de un cliente (pendiente,
    parcial o vencida), de la más atrasada a la más reciente, para que
    el cajero elija a cuál abonar.
    """
    return listar_facturas_pendientes_cliente(db, cliente_id, current_user.empresa_id)


@router.get("/historial/{cliente_id}", response_model=list[HistorialPagoResponse])
def historial_pagos(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA)),
):
    """
    Lista el historial completo de pagos de un cliente, del más reciente
    al más antiguo.
    """
    return listar_pagos_cliente(db, cliente_id, current_user.empresa_id)

