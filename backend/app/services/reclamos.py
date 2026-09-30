from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime, date, timedelta, timezone
import holidays

from app.models.reclamo import Reclamo
from app.models.cliente import Cliente 
from app.models.presion import MedicionPresion
from app.schemas.reclamo import ReclamoCreate, ReclamoResponder, ReclamoUpdate
from app.services.presion import evaluar_cumplimiento
from app.services.historial import calcular_diferencias, registrar_edicion
from app.utils.fechas import ahora, hoy_chile, fecha_chile, rango_mes_chile

from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

DIAS_HABILES_PLAZO = 10
feriados_chile = holidays.CL()


def es_dia_habil(fecha: date) -> bool:
    return fecha.weekday() < 5 and fecha not in feriados_chile  # 0=lunes ... 4=viernes


def sumar_dias_habiles(fecha_inicio: date, dias: int) -> date:
    """Suma 'dias' días hábiles a partir de fecha_inicio (sin contar fecha_inicio)."""
    fecha = fecha_inicio
    contados = 0
    while contados < dias:
        fecha += timedelta(days=1)
        if es_dia_habil(fecha):
            contados += 1
    return fecha


def contar_dias_habiles_entre(fecha_inicio: date, fecha_fin: date) -> int:
    """Cuenta los días hábiles entre dos fechas (sin contar fecha_inicio, incluyendo fecha_fin)."""
    if fecha_fin <= fecha_inicio:
        return 0
    dias = 0
    fecha = fecha_inicio
    while fecha < fecha_fin:
        fecha += timedelta(days=1)
        if es_dia_habil(fecha):
            dias += 1
    return dias


def generar_folio(db: Session, anio: int, empresa_id: int) -> str:
    """Genera el siguiente folio correlativo para el año, dentro de la empresa (ej '2026-001')."""
    ultimo = (
        db.query(Reclamo)
        .filter(Reclamo.anio == anio, Reclamo.empresa_id == empresa_id)
        .order_by(Reclamo.id.desc())
        .first()
    )
    if ultimo is None:
        siguiente = 1
    else:
        siguiente = int(ultimo.folio.split("-")[1]) + 1
    return f"{anio}-{siguiente:03d}"


def crear_reclamo(db: Session, datos: ReclamoCreate, empresa_id: int) -> Reclamo:
    fecha_recepcion = ahora()
    anio = fecha_recepcion.year
    folio = generar_folio(db, anio, empresa_id)
    plazo_vencimiento = sumar_dias_habiles(fecha_chile(fecha_recepcion), DIAS_HABILES_PLAZO)

    nombre_reclamante = datos.nombre_reclamante
    rut_reclamante = datos.rut_reclamante

    if datos.cliente_id is not None:
        cliente = (
            db.query(Cliente)
            .filter(Cliente.id == datos.cliente_id, Cliente.empresa_id == empresa_id)
            .first()
        )
        if cliente is None:
            raise ValueError("Cliente no encontrado")
        # snapshot: se copian aunque el reclamo no traiga estos campos explícitos
        nombre_reclamante = cliente.nombre
        rut_reclamante = cliente.rut

    reclamo = Reclamo(
        empresa_id=empresa_id,
        folio=folio,
        anio=anio,
        cliente_id=datos.cliente_id,
        nombre_reclamante=nombre_reclamante,
        rut_reclamante=rut_reclamante,
        direccion_reclamo=datos.direccion_reclamo,
        tipo_reclamo=datos.tipo_reclamo,
        descripcion=datos.descripcion,
        fecha_recepcion=fecha_recepcion,
        plazo_vencimiento=plazo_vencimiento,
        estado="abierto",
        observaciones=datos.observaciones,
    )
    db.add(reclamo)
    db.commit()
    db.refresh(reclamo)
    return reclamo


def responder_reclamo(db: Session, reclamo_id: int, datos: ReclamoResponder, empresa_id: int) -> Reclamo:
    reclamo = (
        db.query(Reclamo)
        .filter(Reclamo.id == reclamo_id, Reclamo.empresa_id == empresa_id)
        .first()
    )
    if reclamo is None:
        return None

    fecha_respuesta = ahora()
    dias_habiles_respuesta = contar_dias_habiles_entre(
        fecha_chile(reclamo.fecha_recepcion), fecha_chile(fecha_respuesta)
    )
    fuera_de_plazo = fecha_chile(fecha_respuesta) > reclamo.plazo_vencimiento

    reclamo.respuesta = datos.respuesta
    reclamo.fecha_respuesta = fecha_respuesta
    reclamo.dias_habiles_respuesta = dias_habiles_respuesta
    reclamo.fuera_de_plazo = fuera_de_plazo
    reclamo.estado = "respondido"

    db.commit()
    db.refresh(reclamo)
    return reclamo


def cerrar_reclamo(db: Session, reclamo_id: int, empresa_id: int) -> Reclamo:
    """Cierra un reclamo que ya fue respondido."""
    reclamo = (
        db.query(Reclamo)
        .filter(Reclamo.id == reclamo_id, Reclamo.empresa_id == empresa_id)
        .first()
    )
    if reclamo is None:
        return None
    if reclamo.estado != "respondido":
        raise ValueError("Solo se puede cerrar un reclamo que ya fue respondido")
    reclamo.estado = "cerrado"
    db.commit()
    db.refresh(reclamo)
    return reclamo


def cerrar_reclamo_sin_respuesta(db: Session, reclamo_id: int, motivo: str, empresa_id: int) -> Reclamo:
    """Cierra un reclamo directamente, sin pasar por 'respondido' (ej. retiro, duplicado)."""
    reclamo = (
        db.query(Reclamo)
        .filter(Reclamo.id == reclamo_id, Reclamo.empresa_id == empresa_id)
        .first()
    )
    if reclamo is None:
        return None
    if reclamo.estado != "abierto":
        raise ValueError("Solo se puede aplicar cierre directo a un reclamo abierto")
    reclamo.estado = "cerrado_sin_respuesta"
    reclamo.motivo_cierre = motivo
    db.commit()
    db.refresh(reclamo)
    return reclamo


def listar_reclamos(db: Session, empresa_id: int, periodo: str = None, estado: str = None, cliente_id: int = None):
    """periodo en formato 'YYYY-MM', filtra por fecha_recepcion."""
    query = db.query(Reclamo).filter(Reclamo.empresa_id == empresa_id)
    if periodo:
        inicio, fin = rango_mes_chile(periodo)
        query = query.filter(
               Reclamo.fecha_recepcion >= inicio,
               Reclamo.fecha_recepcion < fin,
           )
    if estado:
        query = query.filter(Reclamo.estado == estado)
    if cliente_id:
        query = query.filter(Reclamo.cliente_id == cliente_id)
    return query.order_by(Reclamo.fecha_recepcion.desc()).all()

def obtener_reclamo(db: Session, reclamo_id: int, empresa_id: int) -> Reclamo:
    return (
        db.query(Reclamo)
        .filter(Reclamo.id == reclamo_id, Reclamo.empresa_id == empresa_id)
        .first()
    )



ESTADOS_NO_EDITABLES = {"cerrado", "cerrado_sin_respuesta"}


def editar_reclamo(
    db: Session, reclamo_id: int, datos: ReclamoUpdate, empresa_id: int, usuario_id: int
) -> Reclamo:
    reclamo = obtener_reclamo(db, reclamo_id, empresa_id)
    if reclamo is None:
        return None
    if reclamo.estado in ESTADOS_NO_EDITABLES:
        raise ValueError("No se puede editar un reclamo cerrado")

    cambios = datos.model_dump(exclude_unset=True)
    if not cambios:
        raise ValueError("No se enviaron campos para editar")

    if "respuesta" in cambios and reclamo.estado != "respondido":
        raise ValueError("Solo se puede editar la respuesta de un reclamo ya respondido")

    # Se arman los valores finales ANTES de tocar el objeto, para poder comparar
    nuevos: dict = {}

    # --- Reclamante ---
    cliente_nuevo = None
    if "cliente_id" in cambios:
        if cambios["cliente_id"] is not None:
            cliente_nuevo = (
                db.query(Cliente)
                .filter(Cliente.id == cambios["cliente_id"], Cliente.empresa_id == empresa_id)
                .first()
            )
            if cliente_nuevo is None:
                raise ValueError("Cliente no encontrado")
            nuevos["cliente_id"] = cliente_nuevo.id
            nuevos["nombre_reclamante"] = cliente_nuevo.nombre  # snapshot, igual que al crear
            nuevos["rut_reclamante"] = cliente_nuevo.rut
        else:
            nuevos["cliente_id"] = None

    cliente_final = nuevos.get("cliente_id", reclamo.cliente_id)
    if cliente_final is None:
        # reclamante sin cliente: nombre y RUT se editan a mano
        for campo in ("nombre_reclamante", "rut_reclamante"):
            if campo in cambios:
                nuevos[campo] = cambios[campo]
        nombre_final = nuevos.get("nombre_reclamante", reclamo.nombre_reclamante)
        rut_final = nuevos.get("rut_reclamante", reclamo.rut_reclamante)
        if not nombre_final or not rut_final:
            raise ValueError("Si el reclamo no tiene cliente, nombre y RUT del reclamante son obligatorios")

    # --- Campos simples ---
    for campo in ("direccion_reclamo", "tipo_reclamo", "descripcion", "observaciones", "respuesta"):
        if campo in cambios:
            nuevos[campo] = cambios[campo]

    diferencias = calcular_diferencias(reclamo, nuevos)
    if not diferencias:
        # se guardó sin modificar nada real: no se registra edición
        return reclamo

    # En el historial el cliente se guarda por nombre, no por id
    if "cliente_id" in diferencias:
        diferencias.pop("cliente_id")
        diferencias["cliente"] = {
            "antes": reclamo.cliente.nombre if reclamo.cliente else "Sin cliente registrado",
            "despues": cliente_nuevo.nombre if cliente_nuevo else "Sin cliente registrado",
        }

    for campo, valor in nuevos.items():
        setattr(reclamo, campo, valor)

    # --- Auditoría ---
    momento = ahora()
    reclamo.editado_por_id = usuario_id
    reclamo.fecha_edicion = momento
    registrar_edicion(db, empresa_id, "reclamo", reclamo.id, usuario_id, diferencias, momento)

    db.commit()
    db.refresh(reclamo)
    return reclamo



def obtener_mediciones_por_reclamo(db: Session, reclamo_ids: list[int], empresa_id: int) -> dict[int, list[dict]]:
    """
    Trae todas las mediciones de presión asociadas a una lista de reclamos,
    agrupadas por reclamo_id. Usado para enriquecer el reporte de reclamos
    con su respaldo de mediciones (Cap. de reclamos vinculado a presión).
    """
    if not reclamo_ids:
        return {}

    mediciones = (
        db.query(MedicionPresion)
        .filter(
            MedicionPresion.reclamo_id.in_(reclamo_ids),
            MedicionPresion.empresa_id == empresa_id,
        )
        .order_by(MedicionPresion.fecha_medicion.asc())
        .all()
    )

    por_reclamo: dict[int, list[dict]] = {}
    for m in mediciones:
        evaluacion = evaluar_cumplimiento(float(m.presion_mca), m.fecha_medicion)
        por_reclamo.setdefault(m.reclamo_id, []).append({
            "fecha_medicion": m.fecha_medicion.strftime("%Y-%m-%d"),
            "presion_mca": float(m.presion_mca),
            "cumple": evaluacion["cumple"],
        })
    return por_reclamo


def esta_fuera_de_plazo(reclamo: Reclamo) -> bool:
    """
    Determina si un reclamo está fuera de plazo. Si ya fue respondido, usa
    el valor calculado al momento de la respuesta (fuera_de_plazo guardado).
    Si sigue abierto, lo calcula dinámicamente contra la fecha de hoy —
    de lo contrario un reclamo abierto y vencido nunca se marcaría como
    fuera de plazo hasta que alguien lo responda.
    """
    if reclamo.fuera_de_plazo is not None:
        return reclamo.fuera_de_plazo
    if reclamo.estado == "abierto":
        return hoy_chile() > reclamo.plazo_vencimiento
    return False


def construir_reporte_reclamos(db: Session, periodo: str, empresa_id: int) -> dict:
    """periodo en formato 'YYYY-MM'. Arma el resumen para el reporte de fiscalización SISS."""
    reclamos = listar_reclamos(db, empresa_id, periodo=periodo)

    total = len(reclamos)
    respondidos = [r for r in reclamos if r.dias_habiles_respuesta is not None]
    fuera_de_plazo = [r for r in reclamos if esta_fuera_de_plazo(r)]

    por_tipo: dict[str, int] = {}
    por_estado: dict[str, int] = {}
    for r in reclamos:
        por_tipo[r.tipo_reclamo] = por_tipo.get(r.tipo_reclamo, 0) + 1
        por_estado[r.estado] = por_estado.get(r.estado, 0) + 1

    promedio_dias_respuesta = (
        round(sum(r.dias_habiles_respuesta for r in respondidos) / len(respondidos), 1)
        if respondidos
        else None
    )

    mediciones_por_reclamo = obtener_mediciones_por_reclamo(db, [r.id for r in reclamos], empresa_id)

    detalle = [
        {
            "folio": r.folio,
            "tipo_reclamo": r.tipo_reclamo,
            "nombre_reclamante": r.nombre_reclamante,
            "fecha_recepcion": fecha_chile(r.fecha_recepcion).isoformat(),
            "plazo_vencimiento": r.plazo_vencimiento.strftime("%Y-%m-%d"),
            "estado": r.estado,
            "fecha_respuesta": fecha_chile(r.fecha_respuesta).isoformat() if r.fecha_respuesta else None,
            "dias_habiles_respuesta": r.dias_habiles_respuesta,
            "fuera_de_plazo": esta_fuera_de_plazo(r),
            "mediciones_presion": mediciones_por_reclamo.get(r.id, []),
        }
        for r in reclamos
    ]

    return {
        "periodo": periodo,
        "total_reclamos": total,
        "total_respondidos": len(respondidos),
        "total_fuera_de_plazo": len(fuera_de_plazo),
        "promedio_dias_habiles_respuesta": promedio_dias_respuesta,
        "reclamos_por_tipo": por_tipo,
        "reclamos_por_estado": por_estado,
        "detalle": detalle,
    }

def construir_excel_reporte_reclamos(periodo: str, db: Session, empresa_id: int) -> BytesIO:
    reporte = construir_reporte_reclamos(db, periodo, empresa_id)

    wb = Workbook()
    ws = wb.active
    ws.title = f"Reclamos {periodo}"

    ws["A1"] = "Libro de Reclamos"
    ws["A1"].font = Font(size=14, bold=True)
    ws["A2"] = f"Periodo: {reporte['periodo']}"
    ws["A3"] = f"Total reclamos: {reporte['total_reclamos']} (Respondidos: {reporte['total_respondidos']})"
    ws["A4"] = f"Fuera de plazo: {reporte['total_fuera_de_plazo']}"
    ws["A5"] = f"Promedio días hábiles de respuesta: {reporte['promedio_dias_habiles_respuesta'] if reporte['promedio_dias_habiles_respuesta'] is not None else '—'}"
    ws["A6"] = f"Generado: {ahora().strftime('%d-%m-%Y %H:%M')}"

    headers = [
        "Folio", "Tipo", "Reclamante", "Fecha Recepción", "Plazo Vencimiento",
        "Estado", "Fecha Respuesta", "Días Hábiles Respuesta", "Fuera de Plazo"
    ]
    header_row = 8
    for col, h in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.alignment = Alignment(horizontal="center")

    row = header_row + 1
    for r in reporte["detalle"]:
        ws.cell(row=row, column=1, value=r["folio"])
        ws.cell(row=row, column=2, value=r["tipo_reclamo"])
        ws.cell(row=row, column=3, value=r["nombre_reclamante"] or "—")
        ws.cell(row=row, column=4, value=r["fecha_recepcion"])
        ws.cell(row=row, column=5, value=r["plazo_vencimiento"])
        ws.cell(row=row, column=6, value=r["estado"])
        ws.cell(row=row, column=7, value=r["fecha_respuesta"] or "—")
        ws.cell(row=row, column=8, value=r["dias_habiles_respuesta"] if r["dias_habiles_respuesta"] is not None else "—")
        ws.cell(row=row, column=9, value="Sí" if r["fuera_de_plazo"] else ("No" if r["fuera_de_plazo"] is not None else "—"))
        row += 1

    for col_cells in ws.columns:
        length = max(len(str(c.value)) if c.value else 0 for c in col_cells)
        ws.column_dimensions[col_cells[0].column_letter].width = min(length + 3, 30)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def construir_pdf_reporte_reclamos(periodo: str, db: Session, empresa_id: int) -> BytesIO:
    reporte = construir_reporte_reclamos(db, periodo, empresa_id)
    styles = getSampleStyleSheet()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    elementos = []

    elementos.append(Paragraph("Libro de Reclamos", styles["Title"]))
    elementos.append(Paragraph(f"Periodo: {reporte['periodo']}", styles["Normal"]))
    elementos.append(Paragraph(
        f"Total reclamos: {reporte['total_reclamos']} (Respondidos: {reporte['total_respondidos']}) | "
        f"Fuera de plazo: {reporte['total_fuera_de_plazo']}", styles["Normal"]
    ))
    promedio = reporte["promedio_dias_habiles_respuesta"]
    elementos.append(Paragraph(
        f"Promedio días hábiles de respuesta: {promedio if promedio is not None else '—'}", styles["Normal"]
    ))
    elementos.append(Paragraph(f"Generado: {ahora().strftime('%d-%m-%Y %H:%M')}", styles["Normal"]))
    elementos.append(Spacer(1, 0.5 * cm))

    data = [["Folio", "Tipo", "Reclamante", "F. Recepción", "Plazo", "Estado", "Días Hábiles", "Fuera Plazo"]]
    for r in reporte["detalle"]:
        data.append([
            r["folio"],
            r["tipo_reclamo"],
            r["nombre_reclamante"] or "—",
            r["fecha_recepcion"],
            r["plazo_vencimiento"],
            r["estado"],
            r["dias_habiles_respuesta"] if r["dias_habiles_respuesta"] is not None else "—",
            "Sí" if r["fuera_de_plazo"] else ("No" if r["fuera_de_plazo"] is not None else "—"),
        ])

    tabla = Table(data, repeatRows=1)
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
        ("ALIGN", (6, 1), (-1, -1), "CENTER"),
    ]))
    elementos.append(tabla)

    doc.build(elementos)
    buffer.seek(0)
    return buffer