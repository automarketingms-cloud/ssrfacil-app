from datetime import date
from sqlalchemy.orm import Session

from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

from app.models.pago import Pago
from app.models.factura import Factura
from app.models.cliente import Cliente
from app.models.usuario import Usuario

# CLP no tiene decimales, así que cualquier método de pago puede diferir
# hasta $1 respecto al saldo exacto (por redondeo a la unidad de peso).
TOLERANCIA_REDONDEO_PESO = 1

# Ley N° 20.956 (Regla del Redondeo): solo pagos en efectivo, además de
# la tolerancia de peso de arriba, pueden moverse hasta una decena completa.
TOLERANCIA_REDONDEO_EFECTIVO = 9


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
    empresa_id: int,
    cajero_id: int,
    referencia: str | None = None,   # NUEVO
    observaciones: str | None = None,
) -> Pago:
    from app.services.caja import obtener_caja_abierta

    caja = obtener_caja_abierta(db, cajero_id, empresa_id)
    if not caja:
        raise ValueError("Debes abrir una caja antes de registrar pagos")

    factura = (
        db.query(Factura)
        .filter(Factura.id == factura_id, Factura.empresa_id == empresa_id)
        .first()
    )
    if not factura:
        raise ValueError("Factura no encontrada")

    saldo = calcular_saldo_factura(db, factura)
    if saldo <= 0:
        raise ValueError("Esta factura ya está pagada")
    if monto <= 0:
        raise ValueError("El monto del pago debe ser mayor a cero")

    tolerancia = TOLERANCIA_REDONDEO_PESO
    if metodo_pago == "efectivo":
        tolerancia += TOLERANCIA_REDONDEO_EFECTIVO
    if monto > saldo + tolerancia:
        raise ValueError(
            f"El monto excede el saldo pendiente de esta factura (${saldo:,.0f})"
        )

    pago = Pago(
        empresa_id=empresa_id,
        factura_id=factura_id,
        caja_id=caja.id,
        monto=monto,
        fecha_pago=fecha_pago,
        metodo_pago=metodo_pago,
        referencia=referencia,   # NUEVO
        observaciones=observaciones,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)

    nuevo_saldo = calcular_saldo_factura(db, factura)
    # Si el pago (redondeado a peso, o a decena si fue efectivo) dejó un
    # remanente dentro del margen de redondeo, se considera saldada.
    tolerancia_saldado = TOLERANCIA_REDONDEO_PESO
    if metodo_pago == "efectivo":
        tolerancia_saldado += TOLERANCIA_REDONDEO_EFECTIVO
    if 0 < nuevo_saldo <= tolerancia_saldado:
        nuevo_saldo = 0

    factura.estado = determinar_estado_factura(factura, nuevo_saldo)
    db.commit()

    return pago


def listar_facturas_pendientes_cliente(db: Session, cliente_id: int, empresa_id: int) -> list[dict]:
    """
    Lista las facturas de un cliente (de la empresa del usuario logueado)
    que aún tienen saldo (pendiente, parcial o vencida), ordenadas de la
    más atrasada a la más reciente, con su saldo actual. Pensado para
    que el cajero elija a cuál abonar.
    """
    facturas = (
        db.query(Factura)
        .filter(
            Factura.cliente_id == cliente_id,
            Factura.empresa_id == empresa_id,
            Factura.estado != "pagada",
        )
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

def listar_pagos_cliente(db: Session, cliente_id: int, empresa_id: int) -> list[dict]:
    """
    Lista el historial de pagos de un cliente (todas las facturas de la
    empresa del usuario logueado), del más reciente al más antiguo, con
    el período de la factura a la que corresponde cada pago.
    """
    pagos = (
        db.query(Pago)
        .join(Factura, Pago.factura_id == Factura.id)
        .filter(Factura.cliente_id == cliente_id, Pago.empresa_id == empresa_id)
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
        "referencia": p.referencia,   # NUEVO
        "observaciones": p.observaciones,
    }
    for p in pagos
]

def listar_pagos_del_dia(db: Session, empresa_id: int, fecha: date) -> list[dict]:
    pagos = (
        db.query(Pago)
        .filter(Pago.empresa_id == empresa_id, Pago.fecha_pago == fecha)
        .order_by(Pago.creado_en.desc())
        .all()
    )
    return [
        {
            "pago_id": p.id,
            "factura_id": p.factura_id,
            "periodo": p.factura.periodo,
            "cliente_nombre": p.factura.cliente.nombre,
            "cajero_nombre": p.caja.cajero.nombre,
            "cajero_id": p.caja.cajero_id,
            "monto": p.monto,
            "fecha_pago": p.fecha_pago,
            "metodo_pago": p.metodo_pago,
            "referencia": p.referencia,
            "observaciones": p.observaciones,
        }
        for p in pagos
    ]

def construir_reporte_pagos(
    db: Session,
    empresa_id: int,
    desde: date,
    hasta: date,
    cajero_id: int | None = None,
) -> dict:
    """
    Reporte de pagos filtrado por rango de fechas y, opcionalmente, por
    cajero (trae los pagos de todas las cajas de ese cajero en el rango,
    sin necesidad de filtrar por caja_id aparte).
    """
    query = (
        db.query(Pago)
        .join(Factura, Pago.factura_id == Factura.id)
        .join(Cliente, Factura.cliente_id == Cliente.id)
        .filter(
            Pago.empresa_id == empresa_id,
            Pago.fecha_pago >= desde,
            Pago.fecha_pago <= hasta,
        )
    )

    if cajero_id is not None:
        query = query.join(Pago.caja).filter(Pago.caja.has(cajero_id=cajero_id))

    pagos = query.order_by(Pago.fecha_pago.asc(), Pago.creado_en.asc()).all()

    detalle = [
        {
            "pago_id": p.id,
            "fecha_pago": p.fecha_pago,
            "cliente_nombre": p.factura.cliente.nombre,
            "cliente_rut": p.factura.cliente.rut,
            "periodo": p.factura.periodo,
            "cajero_id": p.caja.cajero_id,
            "cajero_nombre": p.caja.cajero.nombre,
            "caja_id": p.caja_id,
            "metodo_pago": p.metodo_pago,
            "referencia": p.referencia,
            "monto": p.monto,
        }
        for p in pagos
    ]

    resumen_por_metodo: dict[str, dict] = {}
    for p in pagos:
        m = p.metodo_pago
        if m not in resumen_por_metodo:
            resumen_por_metodo[m] = {"metodo_pago": m, "cantidad": 0, "total": 0.0}
        resumen_por_metodo[m]["cantidad"] += 1
        resumen_por_metodo[m]["total"] += p.monto

    total_general = sum(r["total"] for r in resumen_por_metodo.values())

    return {
        "desde": desde,
        "hasta": hasta,
        "cajero_id": cajero_id,
        "pagos": detalle,
        "resumen_por_metodo": list(resumen_por_metodo.values()),
        "total_general": total_general,
    }


def construir_excel_reporte_pagos(
    db: Session,
    empresa_id: int,
    desde: date,
    hasta: date,
    cajero_id: int | None = None,
) -> BytesIO:
    

    reporte = construir_reporte_pagos(db, empresa_id, desde, hasta, cajero_id)

    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte de Pagos"

    encabezados = [
        "Fecha", "Cliente", "RUT", "Periodo", "Cajero",
        "Caja ID", "Método de Pago", "Referencia", "Monto",
    ]
    ws.append(encabezados)

    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    for col_num, _ in enumerate(encabezados, start=1):
        celda = ws.cell(row=1, column=col_num)
        celda.fill = header_fill
        celda.font = header_font
        celda.alignment = Alignment(horizontal="center")

    for p in reporte["pagos"]:
        ws.append([
            p["fecha_pago"].strftime("%d-%m-%Y"),
            p["cliente_nombre"],
            p["cliente_rut"],
            p["periodo"],
            p["cajero_nombre"],
            p["caja_id"],
            p["metodo_pago"].replace("_", " ").capitalize(),
            p["referencia"] or "—",
            p["monto"],
        ])

    fila_actual = len(reporte["pagos"]) + 3
    ws.cell(row=fila_actual, column=1, value="Totales por método de pago").font = Font(bold=True)
    fila_actual += 1
    for r in reporte["resumen_por_metodo"]:
        ws.cell(row=fila_actual, column=1, value=r["metodo_pago"].replace("_", " ").capitalize())
        ws.cell(row=fila_actual, column=2, value=r["cantidad"])
        ws.cell(row=fila_actual, column=3, value=r["total"])
        fila_actual += 1

    ws.cell(row=fila_actual, column=1, value="TOTAL GENERAL").font = Font(bold=True)
    ws.cell(row=fila_actual, column=3, value=reporte["total_general"]).font = Font(bold=True)

    for col_num in range(1, len(encabezados) + 1):
        ws.column_dimensions[get_column_letter(col_num)].width = 18

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer