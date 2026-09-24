from datetime import datetime, timezone
from io import BytesIO
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from sqlalchemy.orm import Session

from app.models.caja import Caja
from app.models.pago import Pago
from app.models.usuario import Usuario, RolUsuario



TZ_CHILE = ZoneInfo("America/Santiago")


def _fecha_chile(dt: datetime | None, formato: str = "%d-%m-%Y %H:%M") -> str:
    if dt is None:
        return "—"
    # Si la columna no guarda zona horaria, se asume que está en UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TZ_CHILE).strftime(formato)


def _clp(valor: float) -> str:
    return f"${valor:,.0f}".replace(",", ".")


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

def editar_monto_inicial(
    db: Session,
    caja_id: int,
    usuario_actual: Usuario,
    nuevo_monto: float,
    motivo: str,
) -> Caja:
    caja = _obtener_caja_o_error(db, caja_id, usuario_actual.empresa_id)
    _validar_propietario_o_admin(caja, usuario_actual)

    if nuevo_monto < 0:
        raise ValueError("El monto inicial no puede ser negativo")
    if not motivo or not motivo.strip():
        raise ValueError("Debes indicar el motivo de la corrección")
    if caja.fecha_arqueo is not None:
        raise ValueError("No se puede modificar una caja que ya fue arqueada")
    if caja.estado == "cerrada" and usuario_actual.rol != RolUsuario.ADMIN:
        raise ValueError("Solo un administrador puede corregir el monto de una caja cerrada")
    if nuevo_monto == caja.monto_inicial:
        raise ValueError("El monto ingresado es igual al actual")

    # Se conserva el valor ORIGINAL de la apertura aunque se corrija varias veces
    if caja.monto_inicial_original is None:
        caja.monto_inicial_original = caja.monto_inicial

    caja.monto_inicial = nuevo_monto
    caja.monto_inicial_editado_por_id = usuario_actual.id
    caja.fecha_edicion_monto_inicial = datetime.now(timezone.utc)
    caja.motivo_edicion_monto_inicial = motivo.strip()

    # Si la caja ya estaba cerrada, el efectivo esperado se calculó con el
    # monto anterior: hay que recalcularlo
    if caja.estado == "cerrada":
        efectivo = (
            db.query(Pago.monto)
            .filter(Pago.caja_id == caja_id, Pago.metodo_pago == "efectivo")
            .all()
        )
        caja.monto_efectivo_esperado = nuevo_monto + sum(m for (m,) in efectivo)

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
    elementos.append(Paragraph(f"Cajero: {escape(caja.cajero.nombre)}", styles["Normal"]))
    elementos.append(Paragraph(
        f"Apertura: {_fecha_chile(caja.fecha_apertura)} | "
        f"Cierre: {_fecha_chile(caja.fecha_cierre)}",
        styles["Normal"],
    ))
    elementos.append(Paragraph(
        f"Monto inicial: {_clp(caja.monto_inicial)} | "
        f"Efectivo esperado: {_clp(caja.monto_efectivo_esperado or 0)}",
        styles["Normal"],
    ))

    # Si el monto inicial fue corregido, se deja constancia en el arqueo
    if caja.monto_inicial_original is not None:
        elementos.append(Paragraph(
            f"<b>Monto inicial corregido.</b> Original: {_clp(caja.monto_inicial_original)}. "
            f"Corregido por {escape(caja.monto_inicial_editado_por_nombre or '—')} "
            f"el {_fecha_chile(caja.fecha_edicion_monto_inicial)}. "
            f"Motivo: {escape(caja.motivo_edicion_monto_inicial or '—')}",
            styles["Normal"],
        ))

    elementos.append(Paragraph(f"Generado: {datetime.now(TZ_CHILE).strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    elementos.append(Spacer(1, 0.5 * cm))

    # Detalle de pagos del turno
    elementos.append(Paragraph("Pagos registrados", styles["Heading2"]))
    data_pagos = [["Hora", "Cliente", "Periodo", "Método", "Referencia", "Monto"]]
    for p in pagos:
        data_pagos.append([
            _fecha_chile(p.creado_en, "%H:%M"),
            p.factura.cliente.nombre,
            p.factura.periodo,
            p.metodo_pago.replace("_", " ").capitalize(),
            p.referencia or "—",
            _clp(p.monto),
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
            _clp(r["total"]),
        ])
    data_totales.append(["TOTAL GENERAL", "", _clp(total_general)])

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