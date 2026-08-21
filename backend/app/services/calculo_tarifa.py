from sqlalchemy.orm import Session
from app.models.lectura import Lectura
from app.models.tarifa import Tarifa, TarifaTramo
from app.models.cliente import Cliente

from datetime import date


def obtener_lectura_anterior(db: Session, cliente_id: int, periodo_actual: str) -> float:
    """
    Busca la última lectura registrada de este cliente,
    anterior al periodo actual. Si no existe (primer registro), devuelve 0.
    """
    ultima_lectura = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == cliente_id, Lectura.periodo < periodo_actual)
        .order_by(Lectura.periodo.desc())
        .first()
    )
    if ultima_lectura:
        return ultima_lectura.lectura_actual
    return 0.0


def calcular_consumo(lectura_actual: float, lectura_anterior: float, permitir_negativo: bool = False) -> float:
    """
    Calcula el consumo en m3. Por defecto no permite negativo (error de
    digitación o el medidor dio la vuelta). Cuando la lectura anterior
    vino de término medio (estimada), sí puede dar negativo si el
    consumo real fue menor al estimado — en ese caso el llamador debe
    pasar permitir_negativo=True para aceptarlo (el ajuste se resuelve
    como crédito a favor del cliente al generar la factura).
    """
    consumo = lectura_actual - lectura_anterior
    if consumo < 0 and not permitir_negativo:
        raise ValueError("La lectura actual no puede ser menor a la anterior")
    return consumo

def calcular_consumo_promedio(db: Session, cliente_id: int, periodo_actual: str) -> tuple[float, int]:
    """
    Calcula el consumo promedio (término medio) para un cliente que no
    pudo ser leído en el periodo actual, según el Capítulo 4 del manual
    SISS: promedio de los consumos de los últimos 3 meses facturados con
    lectura REAL (se excluyen periodos que ya fueron por término medio,
    para no acumular error sobre estimaciones).
    A falta de 3 meses disponibles, se usa el promedio de los que existan.
    Devuelve (consumo_promedio, cantidad_meses_considerados).
    Lanza ValueError si no hay al menos 2 lecturas reales previas (se
    necesitan 2 lecturas consecutivas para obtener 1 consumo).
    """
    lecturas_reales = (
        db.query(Lectura)
        .filter(
            Lectura.cliente_id == cliente_id,
            Lectura.periodo < periodo_actual,
            Lectura.es_promedio == False,
        )
        .order_by(Lectura.periodo.desc())
        .limit(4)
        .all()
    )
    if len(lecturas_reales) < 2:
        raise ValueError(
            "No hay suficiente historial de lecturas reales para calcular término medio "
            "(se necesitan al menos 2 lecturas previas)"
        )

    lecturas_reales.reverse()  # orden cronológico ascendente para restar en orden

    consumos = []
    for i in range(1, len(lecturas_reales)):
        consumo = lecturas_reales[i].lectura_actual - lecturas_reales[i - 1].lectura_actual
        if consumo >= 0:
            consumos.append(consumo)

    consumos_recientes = consumos[-3:]
    if not consumos_recientes:
        raise ValueError("No fue posible calcular consumos válidos a partir del historial")

    promedio = sum(consumos_recientes) / len(consumos_recientes)
    promedio_truncado = float(int(promedio))  # truncar decimal, no redondear (regla del manual)

    return promedio_truncado, len(consumos_recientes)


def obtener_tarifa_vigente(db: Session, periodo: str) -> Tarifa:
    """
    Busca la tarifa vigente para un periodo dado (ej: "2026-07").
    Toma la más reciente cuya fecha de vigencia sea <= al periodo.
    """
    anio, mes = periodo.split("-")
    from datetime import date
    fecha_periodo = date(int(anio), int(mes), 1)

    tarifa = (
        db.query(Tarifa)
        .filter(Tarifa.vigente_desde <= fecha_periodo)
        .order_by(Tarifa.vigente_desde.desc())
        .first()
    )
    if not tarifa:
        raise ValueError("No existe una tarifa vigente para este periodo")
    return tarifa


def calcular_consumo_por_tramos(consumo_m3: float, tramos: list[TarifaTramo]) -> list[dict]:
    """
    Distribuye el consumo total entre los tramos de la tarifa, en orden.
    Cada tramo cubre desde_m3 hasta hasta_m3 (inclusive); el ultimo tramo
    puede tener hasta_m3 = None (sin limite superior).
    Devuelve el detalle de m3 y monto correspondiente a cada tramo.
    """
    detalle = []
    consumo_restante = consumo_m3

    for tramo in sorted(tramos, key=lambda t: t.numero_tramo):
        if consumo_restante <= 0:
            break

        if tramo.hasta_m3 is not None:
            ancho_tramo = tramo.hasta_m3 - tramo.desde_m3 + 1
        else:
            ancho_tramo = consumo_restante

        m3_en_tramo = min(consumo_restante, ancho_tramo)
        if m3_en_tramo <= 0:
            continue

        subtotal = round(m3_en_tramo * tramo.precio_m3, 2)

        detalle.append({
            "numero_tramo": tramo.numero_tramo,
            "m3_en_tramo": m3_en_tramo,
            "precio_m3": tramo.precio_m3,
            "subtotal": subtotal,
        })

        consumo_restante -= m3_en_tramo

    return detalle


def calcular_total_a_pagar(
    consumo_m3: float, tarifa: Tarifa, cliente: Cliente, tasa_iva: float
) -> dict:
    """
    Calcula el desglose de cobro: cargo fijo + variable por tramos +
    cargo fondo de reposición y reinversión - subsidio + IVA (si no es socio).
    ...
    El IVA se aplica sobre el NETO (cargo_fijo + monto_variable +
    cargo_fondo_reposicion - subsidio), solo a clientes que no son socios.
    tasa_iva viene de Configuracion, en porcentaje (ej. 19.0 = 19%).
    """
    detalle_tramos = calcular_consumo_por_tramos(consumo_m3, tarifa.tramos)
    monto_variable = round(sum(t["subtotal"] for t in detalle_tramos), 2)

    cargo_fondo_reposicion = round(consumo_m3 * tarifa.valor_fondo_reposicion, 2)

    subtotal = round(tarifa.cargo_fijo + monto_variable + cargo_fondo_reposicion, 2)

    subsidio_monto = 0.0
    if cliente.tiene_subsidio and cliente.porcentaje_subsidio > 0:
        tramo_1 = next((t for t in detalle_tramos if t["numero_tramo"] == 1), None)
        if tramo_1:
            base_subsidio = tarifa.cargo_fijo + tramo_1["subtotal"]
            subsidio_monto = round(base_subsidio * cliente.porcentaje_subsidio, 2)

    subtotal_neto = (
        tarifa.cargo_fijo + monto_variable + cargo_fondo_reposicion - subsidio_monto
    )

    iva_monto = 0.0
    if not cliente.es_socio:
        iva_monto = round(subtotal_neto * (tasa_iva / 100), 2)

    total = subtotal_neto + iva_monto

    return {
        "cargo_fijo": tarifa.cargo_fijo,
        "detalle_tramos": detalle_tramos,
        "monto_variable": monto_variable,
        "cargo_fondo_reposicion": cargo_fondo_reposicion,
        "subtotal": subtotal,
        "subsidio_aplicado": subsidio_monto,
        "subtotal_neto": round(subtotal_neto, 2),
        "iva_aplicado": iva_monto,
        "total_a_pagar": round(total, 2),
    }

def validar_periodo_no_futuro(periodo: str) -> None:
    """
    Rechaza el registro de una lectura para un periodo posterior al
    mes/año actual. Formato periodo: "YYYY-MM".
    """
    periodo_actual = date.today().strftime("%Y-%m")
    if periodo > periodo_actual:
        raise ValueError(
            f"No se puede registrar una lectura para el periodo {periodo}: "
            f"es posterior al periodo actual ({periodo_actual})"
        )
    
def validar_orden_periodo_facturacion(db: Session, cliente_id: int, periodo: str) -> None:
    """
    Impide generar una factura para un periodo si el cliente ya tiene una
    factura de un periodo MÁS NUEVO. Facturar fuera de orden cronológico
    corrompe el cálculo de saldo_anterior/interes_mora/aviso de corte,
    que asume que "anterior" significa "anterior en el tiempo" (ver
    calcular_saldo_anterior_e_interes y calcular_aviso_corte en
    services/factura.py).
    """
    from app.models.factura import Factura

    factura_mas_nueva = (
        db.query(Factura)
        .filter(Factura.cliente_id == cliente_id, Factura.periodo > periodo)
        .order_by(Factura.periodo.desc())
        .first()
    )
    if factura_mas_nueva:
        raise ValueError(
            f"No se puede generar la factura del periodo {periodo}: este cliente ya "
            f"tiene una factura del periodo {factura_mas_nueva.periodo}, más reciente. "
            f"Facturar fuera de orden puede generar saldos e intereses incorrectos."
        )