# services/continuidad.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.continuidad import CorteContinuidad
from app.schemas.continuidad import CorteCreate, CorteCierre


def crear_corte(db: Session, corte: CorteCreate) -> CorteContinuidad:
    nuevo_corte = CorteContinuidad(**corte.model_dump())
    db.add(nuevo_corte)
    db.commit()
    db.refresh(nuevo_corte)
    return nuevo_corte


def cerrar_corte(db: Session, corte_id: int, cierre: CorteCierre) -> CorteContinuidad:
    corte = db.query(CorteContinuidad).filter(CorteContinuidad.id == corte_id).first()
    if not corte:
        return None
    if corte.fecha_hora_termino is not None:
        raise ValueError("Este corte ya fue cerrado")
    corte.fecha_hora_termino = cierre.fecha_hora_termino
    db.commit()
    db.refresh(corte)
    return corte


def calcular_duracion_horas(corte: CorteContinuidad) -> float | None:
    if corte.fecha_hora_termino is None:
        return None
    delta = corte.fecha_hora_termino - corte.fecha_hora_inicio
    return round(delta.total_seconds() / 3600, 2)


def listar_cortes(db: Session, periodo: str = None, solo_abiertos: bool = False):
    query = db.query(CorteContinuidad)
    if solo_abiertos:
        query = query.filter(CorteContinuidad.fecha_hora_termino.is_(None))
    if periodo:
        # periodo tipo "2026-07" -> filtra por año-mes de fecha_hora_inicio
        anio, mes = map(int, periodo.split("-"))
        query = query.filter(
            func.extract("year", CorteContinuidad.fecha_hora_inicio) == anio,
            func.extract("month", CorteContinuidad.fecha_hora_inicio) == mes,
        )
    return query.order_by(CorteContinuidad.fecha_hora_inicio.desc()).all()


def serializar_corte(corte: CorteContinuidad) -> dict:
    return {
        "id": corte.id,
        "fecha_hora_inicio": corte.fecha_hora_inicio,
        "fecha_hora_termino": corte.fecha_hora_termino,
        "tipo": corte.tipo,
        "causa": corte.causa,
        "sector_afectado": corte.sector_afectado,
        "clientes_afectados": corte.clientes_afectados,
        "observaciones": corte.observaciones,
        "duracion_horas": calcular_duracion_horas(corte),
    }

def construir_reporte_continuidad(periodo: str, db: Session) -> dict:
    """
    Reporte de continuidad de servicio (cortes y reposición) para fiscalización SISS.
    Incluye cortes activos (aún sin reposición) y cortes cerrados del periodo,
    con el detalle de cuánto demoró cada reposición.
    """
    cortes = listar_cortes(db, periodo=periodo)

    if not cortes:
        raise ValueError(f"No hay cortes registrados para el periodo {periodo}")

    detalle_activos = []
    detalle_cerrados = []

    for c in cortes:
        data = serializar_corte(c)
        if c.fecha_hora_termino is None:
            detalle_activos.append(data)
        else:
            detalle_cerrados.append(data)

    duraciones = [d["duracion_horas"] for d in detalle_cerrados if d["duracion_horas"] is not None]
    duracion_promedio = round(sum(duraciones) / len(duraciones), 2) if duraciones else 0
    duracion_total = round(sum(duraciones), 2) if duraciones else 0

    cortes_por_tipo: dict[str, int] = {}
    total_clientes_afectados = 0
    for c in cortes:
        cortes_por_tipo[c.tipo] = cortes_por_tipo.get(c.tipo, 0) + 1
        total_clientes_afectados += c.clientes_afectados or 0

    return {
        "periodo": periodo,
        "total_cortes": len(cortes),
        "total_activos": len(detalle_activos),
        "total_cerrados": len(detalle_cerrados),
        "duracion_promedio_horas": duracion_promedio,
        "duracion_total_horas": duracion_total,
        "total_clientes_afectados": total_clientes_afectados,
        "cortes_por_tipo": cortes_por_tipo,
        "cortes_activos": detalle_activos,
        "cortes_cerrados": detalle_cerrados,
    }