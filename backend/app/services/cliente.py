import io
from sqlalchemy.orm import Session
from openpyxl import Workbook
from openpyxl.styles import Font

from app.models.cliente import Cliente


def construir_reporte_clientes_subsidio(
    db: Session, empresa_id: int, solo_activos: bool = True
) -> list[dict]:
    query = db.query(Cliente).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.tiene_subsidio == True,
    )
    if solo_activos:
        query = query.filter(Cliente.activo == True)

    clientes = query.order_by(Cliente.nombre).all()

    return [
        {
            "id": c.id,
            "nombre": c.nombre,
            "rut": c.rut,
            "numero_medidor": c.numero_medidor,
            "direccion": c.direccion,
            "activo": c.activo,
            "es_socio": c.es_socio,
            "porcentaje_subsidio": c.porcentaje_subsidio,
        }
        for c in clientes
    ]


def construir_excel_reporte_clientes_subsidio(
    db: Session, empresa_id: int, solo_activos: bool = True
) -> io.BytesIO:
    datos = construir_reporte_clientes_subsidio(db, empresa_id, solo_activos)

    wb = Workbook()
    ws = wb.active
    ws.title = "Clientes con subsidio"

    encabezados = ["Nombre", "RUT", "N° Medidor", "Dirección", "Activo", "Socio", "% Subsidio"]
    ws.append(encabezados)
    for celda in ws[1]:
        celda.font = Font(bold=True)

    for c in datos:
        ws.append([
            c["nombre"],
            c["rut"],
            c["numero_medidor"],
            c["direccion"] or "",
            "Sí" if c["activo"] else "No",
            "Sí" if c["es_socio"] else "No",
            f"{c['porcentaje_subsidio'] * 100:.1f}%",
        ])

    for columna in ws.columns:
        largo = max(len(str(celda.value or "")) for celda in columna)
        ws.column_dimensions[columna[0].column_letter].width = largo + 2

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer