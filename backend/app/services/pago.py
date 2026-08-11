from datetime import date
from sqlalchemy.orm import Session

from app.models.pago import Pago
from app.models.factura import Factura


def calcular_saldo_factura(db: Session, factura: Factura) -> float:
    """
    Calcula cuánto falta por pagar de una factura, restando la suma de
    todos sus pagos registrados (soporta pagos parciales acumulados).
    """
    pagos = db.query(Pago).filter(Pago.factura_id == factura.id).all()
    suma_pagada = sum(p.monto for p in pagos)
    return round(factura.total_a_pagar - suma_pagada, 2)


def determinar_estado_factura(factura: Factura, saldo: float) -> str:
    """
    Deriva el estado de una factura a partir de su saldo pendiente.
    """
    if saldo <= 0:
        return "pagada"
    if date.today() > factura.fecha_vencimiento:
        return "vencida"
    if saldo < factura.total_a_pagar:
        return "parcial"
    return "pendiente"


def registrar_pago(
    db: Session,
    factura_id: int,
    monto: float,
    fecha_pago: date,
    metodo_pago: str,
    observaciones: str | None = None,
) -> Pago:
    """
    Registra un pago (total o parcial) sobre una factura específica,
    elegida por el cajero. Lanza ValueError si la factura no existe,
    ya está pagada, o el monto supera el saldo pendiente.
    """
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise ValueError("Factura no encontrada")

    saldo = calcular_saldo_factura(db, factura)
    if saldo <= 0:
        raise ValueError("Esta factura ya está pagada")
    if monto <= 0:
        raise ValueError("El monto del pago debe ser mayor a cero")
    if monto > saldo:
        raise ValueError(
            f"El monto excede el saldo pendiente de esta factura (${saldo:,.0f})"
        )

    pago = Pago(
        factura_id=factura_id,
        monto=monto,
        fecha_pago=fecha_pago,
        metodo_pago=metodo_pago,
        observaciones=observaciones,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)

    nuevo_saldo = calcular_saldo_factura(db, factura)
    factura.estado = determinar_estado_factura(factura, nuevo_saldo)
    db.commit()

    return pago


def listar_facturas_pendientes_cliente(db: Session, cliente_id: int) -> list[dict]:
    """
    Lista las facturas de un cliente que aún tienen saldo (pendiente,
    parcial o vencida), ordenadas de la más atrasada a la más reciente,
    con su saldo actual. Pensado para que el cajero elija a cuál abonar.
    """
    facturas = (
        db.query(Factura)
        .filter(Factura.cliente_id == cliente_id, Factura.estado != "pagada")
        .order_by(Factura.fecha_emision.asc())
        .all()
    )
    return [
        {
            "factura_id": f.id,
            "periodo": f.periodo,
            "fecha_emision": f.fecha_emision,
            "fecha_vencimiento": f.fecha_vencimiento,
            "total_a_pagar": f.total_a_pagar,
            "saldo": calcular_saldo_factura(db, f),
            "estado": f.estado,
        }
        for f in facturas
    ]

def listar_pagos_cliente(db: Session, cliente_id: int) -> list[dict]:
    """
    Lista el historial de pagos de un cliente (todas las facturas), del
    más reciente al más antiguo, con el período de la factura a la que
    corresponde cada pago.
    """
    pagos = (
        db.query(Pago)
        .join(Factura, Pago.factura_id == Factura.id)
        .filter(Factura.cliente_id == cliente_id)
        .order_by(Pago.fecha_pago.desc())
        .all()
    )
    return [
        {
            "pago_id": p.id,
            "factura_id": p.factura_id,
            "periodo": p.factura.periodo,
            "monto": p.monto,
            "fecha_pago": p.fecha_pago,
            "metodo_pago": p.metodo_pago,
            "observaciones": p.observaciones,
        }
        for p in pagos
    ]