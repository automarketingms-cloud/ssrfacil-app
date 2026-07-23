from sqlalchemy.orm import Session
from app.models.lectura import Lectura
from app.models.tarifa import Tarifa, TarifaTramo
from app.models.cliente import Cliente


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


def calcular_consumo(lectura_actual: float, lectura_anterior: float) -> float:
    """
    Calcula el consumo en m3. Nunca debería ser negativo
    (si pasa, es un error de digitación o el medidor dio la vuelta).
    """
    consumo = lectura_actual - lectura_anterior
    if consumo < 0:
        raise ValueError("La lectura actual no puede ser menor a la anterior")
    return consumo


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


IVA_PORCENTAJE = 0.19

def calcular_total_a_pagar(consumo_m3: float, tarifa: Tarifa, cliente: Cliente) -> dict:
    """
    Calcula el desglose de cobro: cargo fijo + variable por tramos - subsidio + IVA (si no es socio).
    El subsidio (si el cliente lo tiene) se aplica como porcentaje SOLO sobre
    (cargo_fijo + subtotal del tramo 1).
    El IVA (19%) se aplica sobre el NETO (cargo_fijo + monto_variable - subsidio),
    solo a clientes que no son socios.
    """
    detalle_tramos = calcular_consumo_por_tramos(consumo_m3, tarifa.tramos)
    monto_variable = round(sum(t["subtotal"] for t in detalle_tramos), 2)

    subsidio_monto = 0.0
    if cliente.tiene_subsidio and cliente.porcentaje_subsidio > 0:
        tramo_1 = next((t for t in detalle_tramos if t["numero_tramo"] == 1), None)
        if tramo_1:
            base_subsidio = tarifa.cargo_fijo + tramo_1["subtotal"]
            subsidio_monto = round(base_subsidio * cliente.porcentaje_subsidio, 2)

    subtotal_neto = tarifa.cargo_fijo + monto_variable - subsidio_monto

    iva_monto = 0.0
    if not cliente.es_socio:
        iva_monto = round(subtotal_neto * IVA_PORCENTAJE, 2)

    total = subtotal_neto + iva_monto

    return {
        "cargo_fijo": tarifa.cargo_fijo,
        "detalle_tramos": detalle_tramos,
        "monto_variable": monto_variable,
        "subsidio_aplicado": subsidio_monto,
        "subtotal_neto": round(subtotal_neto, 2),
        "iva_aplicado": iva_monto,
        "total_a_pagar": round(total, 2),
    }