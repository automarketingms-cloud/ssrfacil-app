from datetime import datetime, date, timezone
from typing import Optional
from zoneinfo import ZoneInfo

TZ_CHILE = ZoneInfo("America/Santiago")


def ahora() -> datetime:
    """
    Instante actual CON zona horaria (Chile). Usar para guardar en columnas
    DateTime(timezone=True) y para textos como "Generado:".
    """
    return datetime.now(TZ_CHILE)


def hoy_chile() -> date:
    """Fecha actual de Chile. Reemplazo de date.today() (el servidor corre en UTC)."""
    return datetime.now(TZ_CHILE).date()


def a_chile(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Convierte un datetime leído de la BD a hora de Chile.
    Las columnas timestamptz llegan en UTC; si viene sin zona (columna antigua),
    se asume UTC, que es como las guardaba el servidor.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TZ_CHILE)


def fecha_chile(dt: Optional[datetime]) -> Optional[date]:
    """Día chileno de un instante (reemplazo de dt.date())."""
    convertido = a_chile(dt)
    return convertido.date() if convertido else None


def rango_mes_chile(periodo: str) -> tuple[datetime, datetime]:
    """
    'YYYY-MM' → (inicio, fin) del mes en hora de Chile.
    Para filtrar columnas timestamptz por mes: columna >= inicio y columna < fin.
    """
    anio, mes = map(int, periodo.split("-"))
    inicio = datetime(anio, mes, 1, tzinfo=TZ_CHILE)
    if mes == 12:
        fin = datetime(anio + 1, 1, 1, tzinfo=TZ_CHILE)
    else:
        fin = datetime(anio, mes + 1, 1, tzinfo=TZ_CHILE)
    return inicio, fin