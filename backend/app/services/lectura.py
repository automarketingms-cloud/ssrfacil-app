from sqlalchemy.orm import Session, joinedload

from app.models.lectura import Lectura
from app.services.calculo_tarifa import calcular_consumo


def listar_lecturas_recientes(db: Session, empresa_id: int, limit: int = 10) -> list[dict]:
    """
    Últimas lecturas registradas en la empresa, la más reciente primero.
    Pensado para el listado de Ingresar Lectura (terreno): datos mínimos, sin foto.
    """
    lecturas = (
        db.query(Lectura)
        .options(joinedload(Lectura.cliente))  # trae el cliente en la misma query
        .filter(Lectura.empresa_id == empresa_id)
        .order_by(Lectura.id.desc())  # id = orden en que se registraron
        .limit(limit)
        .all()
    )

    resultado = []
    for l in lecturas:
        anterior = (
            db.query(Lectura)
            .filter(Lectura.cliente_id == l.cliente_id, Lectura.periodo < l.periodo)
            .order_by(Lectura.periodo.desc())
            .first()
        )
        lectura_anterior = anterior.lectura_actual if anterior else 0.0
        try:
            consumo = calcular_consumo(
                l.lectura_actual,
                lectura_anterior,
                permitir_negativo=bool(anterior and anterior.es_promedio),
            )
        except ValueError:
            consumo = None

        resultado.append({
            "id": l.id,
            "cliente_id": l.cliente_id,
            "cliente_nombre": l.cliente.nombre if l.cliente else None,
            "numero_medidor": l.cliente.numero_medidor if l.cliente else None,
            "periodo": l.periodo,
            "fecha_lectura": l.fecha_lectura,
            "lectura_actual": l.lectura_actual,
            "consumo_m3": consumo,
            "es_promedio": l.es_promedio,
            "tiene_foto": l.foto_ruta is not None,
        })
    return resultado