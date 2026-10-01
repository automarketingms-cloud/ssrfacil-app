from datetime import date, datetime
from typing import Optional
from io import BytesIO

from sqlalchemy.orm import Session

from app.models.presion import MedicionPresion
from app.models.reclamo import Reclamo
from app.schemas.presion import MedicionPresionCreate, MedicionPresionUpdate

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from app.utils.fechas import ahora, hoy_chile
from app.models.usuario import Usuario, RolUsuario
from app.services.historial import calcular_diferencias, registrar_edicion

# Rango vigente: NCh 691:2015, DS MOP N°7 y N°14 de 2016 (15 a 70 mca)
# Rango anterior: según criterio interno indicado (8 a 40 mca antes de 2020)
# Si tienes el decreto exacto de este rango anterior, ajusta la fecha de corte.
FECHA_CAMBIO_NORMA = date(2020, 1, 1)
RANGO_ANTERIOR = (8, 40)
RANGO_VIGENTE = (15, 70)


def obtener_rango_normativo(fecha_medicion: date) -> tuple[float, float]:
    if fecha_medicion < FECHA_CAMBIO_NORMA:
        return RANGO_ANTERIOR
    return RANGO_VIGENTE


def evaluar_cumplimiento(presion_mca: float, fecha_medicion: date) -> dict:
    minimo, maximo = obtener_rango_normativo(fecha_medicion)
    return {
        "rango_minimo": minimo,
        "rango_maximo": maximo,
        "cumple": minimo <= presion_mca <= maximo,
    }


def serializar_medicion(m: MedicionPresion) -> dict:
    evaluacion = evaluar_cumplimiento(float(m.presion_mca), m.fecha_medicion)
    return {
        "id": m.id,
        "punto_medicion": m.punto_medicion,
        "ubicacion": m.ubicacion,
        "fecha_medicion": m.fecha_medicion,
        "hora_medicion": m.hora_medicion,
        "presion_mca": float(m.presion_mca),
        "observaciones": m.observaciones,
        "reclamo_id": m.reclamo_id,
        "cliente_id": m.cliente_id,
        "registrado_por_id": m.registrado_por_id,
        "registrado_por_nombre": m.registrado_por_nombre,
        "editado_por_id": m.editado_por_id,
        "editado_por_nombre": m.editado_por_nombre,
        "fecha_edicion": m.fecha_edicion,
        **evaluacion,
    }


def obtener_mediciones(
    desde: Optional[date],
    hasta: Optional[date],
    db: Session,
    empresa_id: int,
    limit: Optional[int] = None,
):
    query = db.query(MedicionPresion).filter(MedicionPresion.empresa_id == empresa_id)
    if desde:
        query = query.filter(MedicionPresion.fecha_medicion >= desde)
    if hasta:
        query = query.filter(MedicionPresion.fecha_medicion <= hasta)
    query = query.order_by(
        MedicionPresion.fecha_medicion.desc(),
        MedicionPresion.hora_medicion.desc().nulls_last(),
        MedicionPresion.id.desc(),
    )
    if limit:
        query = query.limit(limit)
    return query.all()


def crear_medicion(
    db: Session, datos: MedicionPresionCreate, empresa_id: int, usuario_id: int
) -> MedicionPresion:
    momento = ahora()  # fecha y hora de Chile, las pone el servidor
    cliente_id = None
    if datos.reclamo_id is not None:
        reclamo = (
            db.query(Reclamo)
            .filter(Reclamo.id == datos.reclamo_id, Reclamo.empresa_id == empresa_id)
            .first()
        )
        if reclamo is None:
            raise LookupError("Reclamo no encontrado")
        cliente_id = reclamo.cliente_id  # puede ser None si el reclamo no tiene cliente

    medicion = MedicionPresion(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        registrado_por_id=usuario_id,
        fecha_medicion=momento.date(),
        hora_medicion=momento.time().replace(microsecond=0),
        **datos.model_dump(),
    )
    db.add(medicion)
    db.commit()
    db.refresh(medicion)
    return medicion


def obtener_medicion(db: Session, medicion_id: int, empresa_id: int) -> Optional[MedicionPresion]:
    return (
        db.query(MedicionPresion)
        .filter(MedicionPresion.id == medicion_id, MedicionPresion.empresa_id == empresa_id)
        .first()
    )


def _es_mes_actual(fecha: date) -> bool:
    hoy = hoy_chile()
    return fecha.year == hoy.year and fecha.month == hoy.month


def editar_medicion(
    db: Session, medicion_id: int, datos: MedicionPresionUpdate, usuario: Usuario
) -> Optional[MedicionPresion]:
    medicion = obtener_medicion(db, medicion_id, usuario.empresa_id)
    if medicion is None:
        return None

    es_admin = usuario.rol == RolUsuario.ADMIN

    # --- Permisos: terreno solo edita las mediciones que registró ---
    if usuario.rol == RolUsuario.TERRENO and medicion.registrado_por_id != usuario.id:
        raise PermissionError("Solo puedes editar mediciones registradas por ti")

    # --- Plazo: fuera del mes en curso solo edita admin ---
    if not es_admin and not _es_mes_actual(medicion.fecha_medicion):
        raise ValueError("Solo se pueden editar mediciones del mes en curso")

    cambios = datos.model_dump(exclude_unset=True)
    if not cambios:
        raise ValueError("No se enviaron campos para editar")

    nuevos: dict = {}
    for campo in ("punto_medicion", "ubicacion", "hora_medicion", "presion_mca", "observaciones"):
        if campo in cambios:
            nuevos[campo] = cambios[campo]

    # --- Fecha: nunca futura; si no es admin, tampoco puede salir del mes en curso ---
    if "fecha_medicion" in cambios:
        nueva_fecha = cambios["fecha_medicion"]
        if nueva_fecha > hoy_chile():
            raise ValueError("La fecha de medición no puede ser futura")
        if not es_admin and not _es_mes_actual(nueva_fecha):
            raise ValueError("La fecha de medición debe quedar dentro del mes en curso")
        nuevos["fecha_medicion"] = nueva_fecha

    # --- Reclamo: solo si realmente cambia; el cliente se deriva del reclamo, igual que al crear ---
    reclamo_nuevo = None
    if "reclamo_id" in cambios and cambios["reclamo_id"] != medicion.reclamo_id:
        if cambios["reclamo_id"] is not None:
            reclamo_nuevo = (
                db.query(Reclamo)
                .filter(Reclamo.id == cambios["reclamo_id"], Reclamo.empresa_id == usuario.empresa_id)
                .first()
            )
            if reclamo_nuevo is None:
                raise LookupError("Reclamo no encontrado")
        nuevos["reclamo_id"] = reclamo_nuevo.id if reclamo_nuevo else None
        nuevos["cliente_id"] = reclamo_nuevo.cliente_id if reclamo_nuevo else None

    diferencias = calcular_diferencias(medicion, nuevos)
    if not diferencias:
        # se guardó sin modificar nada real: no se registra edición
        return medicion

    # En el historial el reclamo se muestra por folio; cliente_id es derivado y no se muestra
    diferencias.pop("cliente_id", None)
    if "reclamo_id" in diferencias:
        diferencias.pop("reclamo_id")
        diferencias["reclamo"] = {
            "antes": medicion.reclamo.folio if medicion.reclamo else "Sin reclamo asociado",
            "despues": reclamo_nuevo.folio if reclamo_nuevo else "Sin reclamo asociado",
        }

    for campo, valor in nuevos.items():
        setattr(medicion, campo, valor)

    # --- Auditoría ---
    momento = ahora()
    medicion.editado_por_id = usuario.id
    medicion.fecha_edicion = momento
    registrar_edicion(db, usuario.empresa_id, "medicion_presion", medicion.id, usuario.id, diferencias, momento)

    db.commit()
    db.refresh(medicion)
    return medicion


def construir_excel_reporte_presion(desde: Optional[date], hasta: Optional[date], db: Session, empresa_id: int) -> BytesIO:
    mediciones = obtener_mediciones(desde, hasta, db, empresa_id)
    datos = [serializar_medicion(m) for m in mediciones]

    wb = Workbook()
    ws = wb.active
    ws.title = "Registro de Presión"

    ws["A1"] = "Reporte de Presión de Servicio"
    ws["A1"].font = Font(size=14, bold=True)
    ws["A2"] = f"Desde: {desde or 'sin límite'}  Hasta: {hasta or 'sin límite'}"
    ws["A3"] = f"Mediciones: {len(datos)}"
    ws["A4"] = f"Generado: {ahora().strftime('%d-%m-%Y %H:%M')}"

    headers = ["Punto", "Ubicación", "Fecha", "Hora", "Presión (mca)", "Rango mínimo", "Rango máximo", "Cumple", "Observaciones"]
    header_row = 6
    for col, h in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.alignment = Alignment(horizontal="center")

    row = header_row + 1
    for m in datos:
        ws.cell(row=row, column=1, value=m["punto_medicion"])
        ws.cell(row=row, column=2, value=m["ubicacion"])
        ws.cell(row=row, column=3, value=str(m["fecha_medicion"]))
        ws.cell(row=row, column=4, value=str(m["hora_medicion"]) if m["hora_medicion"] else None)
        ws.cell(row=row, column=5, value=m["presion_mca"])
        ws.cell(row=row, column=6, value=m["rango_minimo"])
        ws.cell(row=row, column=7, value=m["rango_maximo"])
        ws.cell(row=row, column=8, value="Sí" if m["cumple"] else "No")
        ws.cell(row=row, column=9, value=m["observaciones"])
        row += 1

    for col_cells in ws.columns:
        length = max(len(str(c.value)) if c.value else 0 for c in col_cells)
        ws.column_dimensions[col_cells[0].column_letter].width = min(length + 3, 30)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def construir_pdf_reporte_presion(desde: Optional[date], hasta: Optional[date], db: Session, empresa_id: int) -> BytesIO:
    mediciones = obtener_mediciones(desde, hasta, db, empresa_id)
    datos = [serializar_medicion(m) for m in mediciones]
    styles = getSampleStyleSheet()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    elementos = []

    elementos.append(Paragraph("Reporte de Presión de Servicio", styles["Title"]))
    elementos.append(Paragraph(f"Desde: {desde or 'sin límite'} | Hasta: {hasta or 'sin límite'}", styles["Normal"]))
    elementos.append(Paragraph(f"Mediciones: {len(datos)}", styles["Normal"]))
    elementos.append(Paragraph(f"Generado: {ahora().strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    elementos.append(Spacer(1, 0.5 * cm))

    data = [["Punto", "Ubicación", "Fecha", "Presión (mca)", "Rango", "Cumple"]]
    for m in datos:
        data.append([
            m["punto_medicion"], m["ubicacion"] or "—", str(m["fecha_medicion"]),
            m["presion_mca"], f"{m['rango_minimo']}-{m['rango_maximo']}",
            "Sí" if m["cumple"] else "No",
        ])

    tabla = Table(data, repeatRows=1)
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),
    ]))
    elementos.append(tabla)

    doc.build(elementos)
    buffer.seek(0)
    return buffer