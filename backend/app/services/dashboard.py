from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.models.cliente import Cliente
from app.models.reclamo import Reclamo
from app.models.factura import Factura
from app.models.pago import Pago
from sqlalchemy import case
from app.services.continuidad import contar_cortes_activos


def _periodos_anteriores(periodo: str, cantidad: int) -> list[str]:
    """Devuelve 'cantidad' periodos (YYYY-MM) terminando en 'periodo', en orden ascendente."""
    anio, mes = map(int, periodo.split("-"))
    periodos = []
    for i in range(cantidad - 1, -1, -1):
        m = mes - i
        a = anio
        while m <= 0:
            m += 12
            a -= 1
        periodos.append(f"{a}-{m:02d}")
    return periodos


def construir_resumen_dashboard(db: Session, periodo: str) -> dict:
    # --- Clientes ---
    total_clientes_activos, total_socios, total_con_subsidio = (
        db.query(
            func.count(Cliente.id),
            func.sum(case((Cliente.es_socio == True, 1), else_=0)),
            func.sum(case((Cliente.tiene_subsidio == True, 1), else_=0)),
        )
        .filter(Cliente.activo == True)
        .first()
    )
    total_clientes_activos = total_clientes_activos or 0
    total_socios = total_socios or 0
    total_con_subsidio = total_con_subsidio or 0

    # --- Facturación y consumo del mes ---
    total_facturado, total_consumo, cantidad_facturas = (
        db.query(
            func.sum(Factura.total_a_pagar),
            func.sum(Factura.consumo_m3),
            func.count(Factura.id),
        )
        .filter(Factura.periodo == periodo)
        .first()
    )
    facturacion_total_mes = round(total_facturado or 0.0, 2)
    consumo_total_m3 = round(total_consumo or 0.0, 2)
    lecturas_realizadas = cantidad_facturas or 0
    medidores_sin_lectura = max(total_clientes_activos - lecturas_realizadas, 0)

    # --- Reclamos ---
    hoy = date.today()
    total_reclamos_abiertos = (
        db.query(func.count(Reclamo.id))
        .filter(Reclamo.estado == "abierto")
        .scalar()
        or 0
    )
    total_reclamos_fuera_de_plazo = (
        db.query(func.count(Reclamo.id))
        .filter(Reclamo.estado == "abierto", Reclamo.plazo_vencimiento < hoy)
        .scalar()
        or 0
    )

    # --- Cortes ---
    total_cortes_activos = contar_cortes_activos(db)

    # --- Pendiente de cobro y morosos ---
    facturas_con_saldo = (
        db.query(Factura)
        .filter(Factura.estado.in_(["pendiente", "parcial", "vencida"]))
        .all()
    )

    facturas_con_saldo_ids = [f.id for f in facturas_con_saldo]
    pagos_por_factura: dict[int, float] = {}
    if facturas_con_saldo_ids:
        rows = (
            db.query(Pago.factura_id, func.sum(Pago.monto))
            .filter(Pago.factura_id.in_(facturas_con_saldo_ids))
            .group_by(Pago.factura_id)
            .all()
        )
        pagos_por_factura = {factura_id: monto or 0.0 for factura_id, monto in rows}

    monto_pendiente_cobro = round(
        sum(
            f.total_a_pagar - pagos_por_factura.get(f.id, 0.0)
            for f in facturas_con_saldo
        ),
        2,
    )
    clientes_morosos = len(
        {f.cliente_id for f in facturas_con_saldo if f.estado == "vencida"}
    )

    # --- Facturación últimos 6 meses (para el gráfico) ---
    periodos_historicos = _periodos_anteriores(periodo, 6)

    facturado_por_periodo = dict(
        db.query(Factura.periodo, func.sum(Factura.total_a_pagar))
        .filter(Factura.periodo.in_(periodos_historicos))
        .group_by(Factura.periodo)
        .all()
    )
    cobrado_por_periodo = dict(
        db.query(Factura.periodo, func.sum(Pago.monto))
        .join(Pago, Pago.factura_id == Factura.id)
        .filter(Factura.periodo.in_(periodos_historicos))
        .group_by(Factura.periodo)
        .all()
    )

    facturacion_historica = [
        {
            "periodo": p,
            "facturado": round(facturado_por_periodo.get(p) or 0.0, 2),
            "cobrado": round(cobrado_por_periodo.get(p) or 0.0, 2),
        }
        for p in periodos_historicos
    ]

    return {
        "periodo": periodo,
        "clientes_activos": total_clientes_activos,
        "socios_activos": total_socios,
        "clientes_con_subsidio": total_con_subsidio,
        "facturacion_total_mes": facturacion_total_mes,
        "consumo_total_m3": consumo_total_m3,
        "lecturas_realizadas": lecturas_realizadas,
        "medidores_sin_lectura": medidores_sin_lectura,
        "reclamos_abiertos": total_reclamos_abiertos,
        "reclamos_fuera_de_plazo": total_reclamos_fuera_de_plazo,
        "cortes_activos": total_cortes_activos,
        "monto_pendiente_cobro": monto_pendiente_cobro,
        "clientes_morosos": clientes_morosos,
        "facturacion_ultimos_6_meses": facturacion_historica,
    }