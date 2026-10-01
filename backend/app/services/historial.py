from datetime import datetime, date, time, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.historial import HistorialEdicion
from app.utils.fechas import ahora


def _serializar(valor):
    """Deja el valor listo para guardarse en JSONB."""
    if isinstance(valor, (datetime, date, time)):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return float(valor)
    return valor


def _son_iguales(actual, nuevo) -> bool:
    # Decimal (BD) vs float (request): se comparan como float para evitar falsos cambios
    if isinstance(actual, Decimal) or isinstance(nuevo, Decimal):
        if actual is None or nuevo is None:
            return actual is None and nuevo is None
        return float(actual) == float(nuevo)
    return actual == nuevo


def calcular_diferencias(objeto, nuevos_valores: dict) -> dict:
    """
    Compara los valores nuevos contra los actuales del objeto (antes de asignarlos)
    y devuelve solo los que realmente cambian: {"campo": {"antes": x, "despues": y}}.
    """
    diferencias = {}
    for campo, nuevo in nuevos_valores.items():
        actual = getattr(objeto, campo)
        if not _son_iguales(actual, nuevo):
            diferencias[campo] = {
                "antes": _serializar(actual),
                "despues": _serializar(nuevo),
            }
    return diferencias


def registrar_edicion(
    db: Session,
    empresa_id: int,
    entidad: str,
    entidad_id: int,
    usuario_id: int,
    cambios: dict,
    fecha: datetime = None,
) -> HistorialEdicion:
    """
    Agrega el registro a la sesión SIN hacer commit: el commit lo hace quien llama,
    así la edición y su historial se guardan en la misma transacción (o ninguno).
    """
    registro = HistorialEdicion(
        empresa_id=empresa_id,
        entidad=entidad,
        entidad_id=entidad_id,
        usuario_id=usuario_id,
        fecha=fecha or ahora(),
        cambios=cambios,
    )
    db.add(registro)
    return registro


def listar_historial(db: Session, empresa_id: int, entidad: str, entidad_id: int):
    return (
        db.query(HistorialEdicion)
        .filter(
            HistorialEdicion.empresa_id == empresa_id,
            HistorialEdicion.entidad == entidad,
            HistorialEdicion.entidad_id == entidad_id,
        )
        .order_by(HistorialEdicion.fecha.desc())
        .all()
    )
