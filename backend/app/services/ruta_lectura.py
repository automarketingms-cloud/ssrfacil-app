from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from io import BytesIO
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.models.cliente import Cliente
from app.models.lectura import Lectura


def obtener_periodo_actual() -> str:
    hoy = date.today()
    return f"{hoy.year}-{hoy.month:02d}"


def construir_ruta_lectura(db: Session, estado: str | None = None) -> dict:
    """
    Clientes activos del período actual con su estado de lectura.
    estado: "pendiente", "leido", o None (todos).
    Ordenados por número de medidor.
    """
    periodo = obtener_periodo_actual()

    leidos_subquery = select(Lectura.cliente_id).where(Lectura.periodo == periodo)

    query = db.query(Cliente).filter(Cliente.activo == True)

    if estado == "pendiente":
        query = query.filter(~Cliente.id.in_(leidos_subquery))
    elif estado == "leido":
        query = query.filter(Cliente.id.in_(leidos_subquery))

    clientes = query.order_by(Cliente.numero_medidor).all()

    ids_leidos = {
        row[0]
        for row in db.query(Lectura.cliente_id).filter(Lectura.periodo == periodo).all()
    }

    detalle = [
        {
            "cliente_id": c.id,
            "nombre": c.nombre,
            "numero_medidor": c.numero_medidor,
            "direccion": c.direccion,
            "estado": "leido" if c.id in ids_leidos else "pendiente",
        }
        for c in clientes
    ]

    total_pendientes = sum(1 for d in detalle if d["estado"] == "pendiente")
    total_leidos = sum(1 for d in detalle if d["estado"] == "leido")

    return {
        "periodo": periodo,
        "total_pendientes": total_pendientes,
        "total_leidos": total_leidos,
        "clientes": detalle,
    }

def construir_excel_ruta_lectura(db: Session) -> BytesIO:
    datos = construir_ruta_lectura(db)

    wb = Workbook()
    ws = wb.active
    ws.title = "Ruta de Lectura"

    ws.append([f"Ruta de lectura - período {datos['periodo']}"])
    ws.append([f"Total pendientes: {datos['total_pendientes']}"])
    ws.append([])
    ws.append(["N° Medidor", "Cliente", "Dirección"])

    for c in datos["clientes"]:
        ws.append([c["numero_medidor"], c["nombre"], c["direccion"]])

    ws.column_dimensions["A"].width = 15
    ws.column_dimensions["B"].width = 30
    ws.column_dimensions["C"].width = 40

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def construir_pdf_ruta_lectura(db: Session) -> BytesIO:
    datos = construir_ruta_lectura(db)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elementos = []

    elementos.append(Paragraph(f"Ruta de lectura - período {datos['periodo']}", styles["Title"]))
    elementos.append(Paragraph(f"Total pendientes: {datos['total_pendientes']}", styles["Normal"]))
    elementos.append(Spacer(1, 12))

    filas = [["N° Medidor", "Cliente", "Dirección"]]
    for c in datos["clientes"]:
        filas.append([c["numero_medidor"], c["nombre"], c["direccion"]])

    tabla = Table(filas, colWidths=[80, 150, 250])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
    ]))
    elementos.append(tabla)

    doc.build(elementos)
    buffer.seek(0)
    return buffer