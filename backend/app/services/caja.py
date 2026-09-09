from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from sqlalchemy.orm import Session

from app.models.caja import Caja
from app.models.pago import Pago
from app.models.usuario import Usuario, RolUsuario


def obtener_caja_abierta(db: Session, cajero_id: int, empresa_id: int) -> Caja | None:
    return (
        db.query(Caja)
        .filter(Caja.cajero_id == cajero_id, Caja.empresa_id == empresa_id, Caja.estado == "abierta")
        .first()
    )


def abrir_caja(db: Session, cajero_id: int, empresa_id: int, monto_inicial: float) -> Caja:
    if monto_inicial < 0:
        raise ValueError("El monto inicial no puede ser negativo")

    if obtener_caja_abierta(db, cajero_id, empresa_id):
        raise ValueError("Ya tienes una caja abierta")

    caja = Caja(
        empresa_id=empresa_id,
        cajero_id=cajero_id,
        monto_inicial=monto_inicial,
        estado="abierta",
    )
    db.add(caja)
    db.commit()
    db.refresh(caja)
    return caja


def _resumen_por_metodo(db: Session, caja_id: int) -> list[dict]:
    pagos = db.query(Pago).filter(Pago.caja_id == caja_id).all()
    agrupado: dict[str, dict] = {}
    for p in pagos:
        if p.metodo_pago not in agrupado:
            agrupado[p.metodo_pago] = {"metodo_pago": p.metodo_pago, "cantidad": 0, "total": 0.0}
        agrupado[p.metodo_pago]["cantidad"] += 1
        agrupado[p.metodo_pago]["total"] += p.monto
    return list(agrupado.values())


def _obtener_caja_o_error(db: Session, caja_id: int, empresa_id: int) -> Caja:
    caja = (
        db.query(Caja)
        .filter(Caja.id == caja_id, Caja.empresa_id == empresa_id)
        .first()
    )
    if not caja:
        raise ValueError("Caja no encontrada")
    return caja


def _validar_propietario_o_admin(caja: Caja, usuario_actual: Usuario) -> None:
    if usuario_actual.rol != RolUsuario.ADMIN and caja.cajero_id != usuario_actual.id:
        raise ValueError("Esta caja no te pertenece")


def cerrar_caja(
    db: Session,
    caja_id: int,
    usuario_actual: Usuario,
    observaciones_cierre: str | None,
) -> Caja:
    caja = _obtener_caja_o_error(db, caja_id, usuario_actual.empresa_id)
    _validar_propietario_o_admin(caja, usuario_actual)

    if caja.estado == "cerrada":
        raise ValueError("Esta caja ya está cerrada")

    total_efectivo = (
        db.query(Pago)
        .filter(Pago.caja_id == caja_id, Pago.metodo_pago == "efectivo")
        .with_entities(Pago.monto)
        .all()
    )
    suma_efectivo = sum(m for (m,) in total_efectivo)
    monto_esperado = caja.monto_inicial + suma_efectivo

    caja.monto_efectivo_esperado = monto_esperado
    caja.observaciones_cierre = observaciones_cierre
    caja.fecha_cierre = datetime.now(timezone.utc)
    caja.estado = "cerrada"

    db.commit()
    db.refresh(caja)
    return caja


def realizar_arqueo(
    db: Session,
    caja_id: int,
    usuario_actual: Usuario,
    observaciones_arqueo: str | None = None,
) -> Caja:
    caja = _obtener_caja_o_error(db, caja_id, usuario_actual.empresa_id)
    _validar_propietario_o_admin(caja, usuario_actual)

    if caja.estado != "cerrada":
        raise ValueError("Solo se puede arquear una caja que ya está cerrada")

    if caja.fecha_arqueo is not None:
        raise ValueError("Esta caja ya fue arqueada")

    caja.observaciones_arqueo = observaciones_arqueo
    caja.arqueado_por_id = usuario_actual.id
    caja.fecha_arqueo = datetime.now(timezone.utc)

    db.commit()
    db.refresh(caja)
    return caja


def obtener_resumen_caja(db: Session, caja_id: int, empresa_id: int) -> dict:
    caja = _obtener_caja_o_error(db, caja_id, empresa_id)
    resumen = _resumen_por_metodo(db, caja_id)
    total_general = sum(r["total"] for r in resumen)

    return {"caja": caja, "resumen_por_metodo": resumen, "total_general": total_general}


def listar_historial_cajas(db: Session, cajero_id: int, empresa_id: int, limit: int = 30) -> list[Caja]:
    """
    Lista las cajas (abiertas y cerradas) del cajero logueado, de la
    empresa del usuario, de la más reciente a la más antigua.
    """
    return (
        db.query(Caja)
        .filter(Caja.cajero_id == cajero_id, Caja.empresa_id == empresa_id)
        .order_by(Caja.fecha_apertura.desc())
        .limit(limit)
        .all()
    )

def listar_cajas_empresa(
    db: Session, empresa_id: int, estado: str | None = None, limit: int = 100
) -> list[Caja]:
    """
    Lista las cajas de TODA la empresa (todos los cajeros), pensado para
    que admin detecte cajas abiertas o pendientes de arqueo. Opcionalmente
    filtra por estado ("abierta" o "cerrada").
    """
    query = db.query(Caja).filter(Caja.empresa_id == empresa_id)
    if estado:
        query = query.filter(Caja.estado == estado)
    return query.order_by(Caja.fecha_apertura.desc()).limit(limit).all()

def obtener_detalle_caja(db: Session, caja_id: int, usuario_actual: Usuario) -> dict:
    """
    Detalle completo de una caja (turno) para mostrar en pantalla: cada
    pago con cliente (RUT + nombre), método, referencia y monto, más los
    totales por método. Es la versión JSON de lo que construye el PDF.
    """
    caja = _obtener_caja_o_error(db, caja_id, usuario_actual.empresa_id)
    _validar_propietario_o_admin(caja, usuario_actual)

    pagos = (
        db.query(Pago)
        .filter(Pago.caja_id == caja_id)
        .order_by(Pago.creado_en.asc())
        .all()
    )

    detalle_pagos = [
        {
            "pago_id": p.id,
            "hora": p.creado_en,
            "cliente_nombre": p.factura.cliente.nombre,
            "cliente_rut": p.factura.cliente.rut,
            "periodo": p.factura.periodo,
            "metodo_pago": p.metodo_pago,
            "referencia": p.referencia,
            "monto": p.monto,
        }
        for p in pagos
    ]

    resumen = _resumen_por_metodo(db, caja_id)
    total_general = sum(r["total"] for r in resumen)

    return {
        "caja": caja,
        "pagos": detalle_pagos,
        "resumen_por_metodo": resumen,
        "total_general": total_general,
    }

def construir_pdf_arqueo_caja(db: Session, caja_id: int, usuario_actual: Usuario) -> BytesIO:
    """
    Genera el detalle de una caja (turno de un cajero) en PDF: pagos
    registrados durante el turno, agrupados por método de pago, con
    totales. Pensado para verse/descargarse al momento del arqueo.
    """
    caja = _obtener_caja_o_error(db, caja_id, usuario_actual.empresa_id)
    _validar_propietario_o_admin(caja, usuario_actual)

    pagos = (
        db.query(Pago)
        .filter(Pago.caja_id == caja_id)
        .order_by(Pago.creado_en.asc())
        .all()
    )
    resumen = _resumen_por_metodo(db, caja_id)
    total_general = sum(r["total"] for r in resumen)

    styles = getSampleStyleSheet()
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    elementos = []

    elementos.append(Paragraph("Detalle de Caja — Arqueo", styles["Title"]))
    elementos.append(Paragraph(f"Cajero: {caja.cajero.nombre}", styles["Normal"]))
    elementos.append(Paragraph(
        f"Apertura: {caja.fecha_apertura.strftime('%d-%m-%Y %H:%M')} | "
        f"Cierre: {caja.fecha_cierre.strftime('%d-%m-%Y %H:%M') if caja.fecha_cierre else '—'}",
        styles["Normal"],
    ))
    elementos.append(Paragraph(
        f"Monto inicial: ${caja.monto_inicial:,.0f} | "
        f"Efectivo esperado: ${caja.monto_efectivo_esperado or 0:,.0f}",
        styles["Normal"],
    ))
    elementos.append(Paragraph(f"Generado: {datetime.now().strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    elementos.append(Spacer(1, 0.5 * cm))

    # Detalle de pagos del turno
    elementos.append(Paragraph("Pagos registrados", styles["Heading2"]))
    data_pagos = [["Hora", "Cliente", "Periodo", "Método", "Referencia", "Monto"]]
    for p in pagos:
        data_pagos.append([
            p.creado_en.strftime("%H:%M"),
            p.factura.cliente.nombre,
            p.factura.periodo,
            p.metodo_pago.replace("_", " ").capitalize(),
            p.referencia or "—",
            f"${p.monto:,.0f}",
        ])
    if len(data_pagos) == 1:
        data_pagos.append(["—", "Sin pagos registrados en este turno", "", "", "", ""])

    tabla_pagos = Table(data_pagos, repeatRows=1)
    tabla_pagos.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
        ("ALIGN", (5, 1), (5, -1), "RIGHT"),
    ]))
    elementos.append(tabla_pagos)
    elementos.append(Spacer(1, 0.6 * cm))

    # Totales por método de pago
    elementos.append(Paragraph("Totales por método de pago", styles["Heading2"]))
    data_totales = [["Método", "Cantidad", "Total"]]
    for r in resumen:
        data_totales.append([
            r["metodo_pago"].replace("_", " ").capitalize(),
            str(r["cantidad"]),
            f"${r['total']:,.0f}",
        ])
    data_totales.append(["TOTAL GENERAL", "", f"${total_general:,.0f}"])

    tabla_totales = Table(data_totales, colWidths=[6 * cm, 3 * cm, 4 * cm])
    tabla_totales.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#D9E2F3")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    elementos.append(tabla_totales)

    doc.build(elementos)
    buffer.seek(0)
    return buffer