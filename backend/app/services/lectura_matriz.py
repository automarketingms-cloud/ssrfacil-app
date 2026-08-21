from sqlalchemy.orm import Session
from app.models.lectura_matriz import LecturaMatriz
from app.models.lectura import Lectura  # ajusta el import según tu estructura
from app.schemas.lectura_matriz import LecturaMatrizCreate


def obtener_lectura_matriz_anterior(db: Session, periodo: str) -> LecturaMatriz | None:
    """
    Trae la lectura del período inmediatamente anterior (el más reciente
    antes del periodo dado), igual que obtener_lectura_anterior para clientes.
    """
    return (
        db.query(LecturaMatriz)
        .filter(LecturaMatriz.periodo < periodo)
        .order_by(LecturaMatriz.periodo.desc())
        .first()
    )


def obtener_consumo_matriz_periodo(db: Session, periodo: str) -> float:
    """
    Devuelve el consumo (m3) registrado por la lectura matriz en un período,
    o 0.0 si no hay lectura matriz para ese período. Helper compartido por
    calcular_comparativa_agua y calcular_comparativa_periodos para no repetir
    la misma query en ambos.
    """
    lectura_matriz = db.query(LecturaMatriz).filter(LecturaMatriz.periodo == periodo).first()
    return lectura_matriz.consumo_m3 if lectura_matriz else 0.0


def actualizar_lectura_matriz(db: Session, lectura_id: int, data: "LecturaMatrizUpdate") -> LecturaMatriz:
    lectura = db.query(LecturaMatriz).filter(LecturaMatriz.id == lectura_id).first()
    if not lectura:
        raise ValueError("Lectura matriz no encontrada")

    if data.lectura_actual is not None:
        lectura_anterior = obtener_lectura_matriz_anterior(db, lectura.periodo)
        lectura.lectura_actual = data.lectura_actual
        lectura.consumo_m3 = calcular_consumo_matriz(
            data.lectura_actual,
            lectura_anterior.lectura_actual if lectura_anterior else None,
        )

    if data.fecha_lectura is not None:
        lectura.fecha_lectura = data.fecha_lectura
    if data.observaciones is not None:
        lectura.observaciones = data.observaciones

    db.commit()
    db.refresh(lectura)

    # el período siguiente calcula su consumo contra ESTA lectura, hay que recalcularlo
    if data.lectura_actual is not None:
        siguiente = (
            db.query(LecturaMatriz)
            .filter(LecturaMatriz.periodo > lectura.periodo)
            .order_by(LecturaMatriz.periodo.asc())
            .first()
        )
        if siguiente:
            siguiente.consumo_m3 = calcular_consumo_matriz(
                siguiente.lectura_actual, lectura.lectura_actual
            )
            db.commit()

    return lectura


def calcular_consumo_matriz(lectura_actual: float, lectura_anterior: float | None) -> float:
    lectura_anterior_valor = lectura_anterior if lectura_anterior is not None else 0.0
    consumo = lectura_actual - lectura_anterior_valor
    if consumo < 0:
        raise ValueError("La lectura actual no puede ser menor a la lectura anterior")
    return consumo


def crear_lectura_matriz(db: Session, data: LecturaMatrizCreate, foto_ruta: str) -> LecturaMatriz:
    existente = db.query(LecturaMatriz).filter(LecturaMatriz.periodo == data.periodo).first()
    if existente:
        raise ValueError(f"Ya existe una lectura matriz registrada para el período {data.periodo}")

    lectura_anterior = obtener_lectura_matriz_anterior(db, data.periodo)
    consumo_m3 = calcular_consumo_matriz(
        data.lectura_actual,
        lectura_anterior.lectura_actual if lectura_anterior else None,
    )

    nueva = LecturaMatriz(
        periodo=data.periodo,
        fecha_lectura=data.fecha_lectura,
        lectura_actual=data.lectura_actual,
        consumo_m3=consumo_m3,
        observaciones=data.observaciones,
        foto_ruta=foto_ruta,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def listar_lecturas_matriz(db: Session) -> list[LecturaMatriz]:
    return db.query(LecturaMatriz).order_by(LecturaMatriz.periodo.desc()).all()



def calcular_consumo_total_clientes(db: Session, periodo: str) -> float:
    """
    Suma el consumo real de todos los clientes en el período. Lectura no
    guarda consumo_m3 como columna (se calcula al vuelo en facturacion.py),
    así que se replica el mismo criterio: sin lectura anterior, se compara
    contra 0 (igual que calcular_consumo para la primera lectura de un cliente).
    Evita N+1 trayendo lecturas del período y anteriores en 2 queries.
    """
    lecturas_periodo = (
        db.query(Lectura.cliente_id, Lectura.lectura_actual)
        .filter(Lectura.periodo == periodo)
        .all()
    )
    if not lecturas_periodo:
        return 0.0

    cliente_ids = [cliente_id for cliente_id, _ in lecturas_periodo]

    lecturas_anteriores = (
        db.query(Lectura.cliente_id, Lectura.periodo, Lectura.lectura_actual)
        .filter(Lectura.cliente_id.in_(cliente_ids), Lectura.periodo < periodo)
        .order_by(Lectura.cliente_id, Lectura.periodo.desc())
        .all()
    )
    anterior_por_cliente = {}
    for cliente_id, _periodo, lectura_actual in lecturas_anteriores:
        if cliente_id not in anterior_por_cliente:
            anterior_por_cliente[cliente_id] = lectura_actual  # primera = más reciente (orden desc)

    total = 0.0
    for cliente_id, lectura_actual in lecturas_periodo:
        lectura_anterior = anterior_por_cliente.get(cliente_id, 0.0)
        consumo = lectura_actual - lectura_anterior
        if consumo < 0:
            continue  # término medio con crédito: no sumar negativo a la comparativa
        total += consumo

    return total


def calcular_comparativa_agua(db: Session, periodo: str) -> dict:
    """
    Compara el consumo del medidor matriz contra la suma de consumo de
    todos los clientes en el mismo período, para detectar agua no
    facturada (pérdidas, fugas, errores de medición, etc.)
    """
    lectura_matriz = (
        db.query(LecturaMatriz).filter(LecturaMatriz.periodo == periodo).first()
    )
    consumo_matriz = obtener_consumo_matriz_periodo(db, periodo)
    consumo_clientes = calcular_consumo_total_clientes(db, periodo)

    agua_no_facturada_m3 = consumo_matriz - consumo_clientes
    porcentaje_perdida = (
        (agua_no_facturada_m3 / consumo_matriz * 100) if consumo_matriz > 0 else 0.0
    )

    return {
        "periodo": periodo,
        "consumo_matriz_m3": consumo_matriz,
        "consumo_clientes_m3": consumo_clientes,
        "agua_no_facturada_m3": agua_no_facturada_m3,
        "porcentaje_perdida": round(porcentaje_perdida, 2),
        "tiene_lectura_matriz": lectura_matriz is not None,
    }


def calcular_comparativa_historica(db: Session, meses: int = 6) -> list[dict]:
    """
    Devuelve la comparativa de agua no facturada para los últimos N períodos
    con lectura matriz registrada, ordenados del más antiguo al más reciente
    (para graficar tendencia). Útil para detectar fugas que crecen gradualmente
    en vez de aparecer de golpe en un solo mes.
    """
    periodos = (
        db.query(LecturaMatriz.periodo)
        .order_by(LecturaMatriz.periodo.desc())
        .limit(meses)
        .all()
    )
    periodos_ordenados = sorted(p[0] for p in periodos)  # ascendente para el gráfico

    return [calcular_comparativa_agua(db, periodo) for periodo in periodos_ordenados]


def calcular_comparativa_periodos(db: Session, periodos: list[str]) -> dict:
    """
    Agrega consumo matriz y consumo clientes sobre un conjunto de períodos
    (un año completo o el histórico total), sumando los m3 en vez de
    promediar los porcentajes mensuales — es la forma correcta de calcular
    un % de pérdida agregado.
    """
    consumo_matriz_total = 0.0
    consumo_clientes_total = 0.0
    for periodo in periodos:
        consumo_matriz_total += obtener_consumo_matriz_periodo(db, periodo)
        consumo_clientes_total += calcular_consumo_total_clientes(db, periodo)

    agua_no_facturada_m3 = consumo_matriz_total - consumo_clientes_total
    porcentaje_perdida = (
        (agua_no_facturada_m3 / consumo_matriz_total * 100) if consumo_matriz_total > 0 else 0.0
    )
    return {
        "consumo_matriz_m3": consumo_matriz_total,
        "consumo_clientes_m3": consumo_clientes_total,
        "agua_no_facturada_m3": agua_no_facturada_m3,
        "porcentaje_perdida": round(porcentaje_perdida, 2),
    }


def calcular_comparativa_anual(db: Session, anio: str) -> dict:
    periodos = [
        p[0] for p in db.query(LecturaMatriz.periodo)
        .filter(LecturaMatriz.periodo.like(f"{anio}-%"))
        .all()
    ]
    resultado = calcular_comparativa_periodos(db, periodos)
    resultado["anio"] = anio
    resultado["tiene_datos"] = len(periodos) > 0
    return resultado


def calcular_comparativa_total(db: Session) -> dict:
    periodos = [p[0] for p in db.query(LecturaMatriz.periodo).all()]
    resultado = calcular_comparativa_periodos(db, periodos)
    resultado["tiene_datos"] = len(periodos) > 0
    return resultado