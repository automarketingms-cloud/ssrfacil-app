from sqlalchemy.orm import Session
from datetime import date

from app.models.cliente import Cliente
from app.models.reclamo import Reclamo
from app.models.factura import Factura
from app.models.pago import Pago
from app.services.factura import construir_reporte_facturacion
from app.services.continuidad import listar_cortes
from app.services.pago import calcular_saldo_factura


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
    clientes_activos = db.query(Cliente).filter(Cliente.activo == True).all()
    total_clientes_activos = len(clientes_activos)
    total_socios = len([c for c in clientes_activos if c.es_socio])
    total_con_subsidio = len([c for c in clientes_activos if c.tiene_subsidio])

    # --- Facturación y consumo del mes ---
    try:
        reporte = construir_reporte_facturacion(periodo, db)
        facturacion_total_mes = reporte["total_recaudado"]
        consumo_total_m3 = round(sum(d["consumo_m3"] for d in reporte["detalle"]), 2)
        lecturas_realizadas = reporte["cantidad_clientes_facturados"]
    except ValueError:
        facturacion_total_mes = 0.0
        consumo_total_m3 = 0.0
        lecturas_realizadas = 0

    medidores_sin_lectura = max(total_clientes_activos - lecturas_realizadas, 0)

    # --- Reclamos ---
    hoy = date.today()
    reclamos_abiertos = db.query(Reclamo).filter(Reclamo.estado == "abierto").all()
    total_reclamos_abiertos = len(reclamos_abiertos)
    total_reclamos_fuera_de_plazo = len(
        [r for r in reclamos_abiertos if r.plazo_vencimiento < hoy]
    )

    # --- Cortes ---
    cortes_activos = listar_cortes(db, solo_abiertos=True)
    total_cortes_activos = len(cortes_activos)

    # --- Pendiente de cobro y morosos ---
    facturas_con_saldo = (
        db.query(Factura)
        .filter(Factura.estado.in_(["pendiente", "parcial", "vencida"]))
        .all()
    )
    monto_pendiente_cobro = round(
        sum(calcular_saldo_factura(db, f) for f in facturas_con_saldo), 2
    )
    clientes_morosos = len(
        {f.cliente_id for f in facturas_con_saldo if f.estado == "vencida"}
    )

    # --- Facturación últimos 6 meses (para el gráfico) ---
    facturacion_historica = []
    for p in _periodos_anteriores(periodo, 6):
        try:
            total_facturado = construir_reporte_facturacion(p, db)["total_recaudado"]
        except ValueError:
            total_facturado = 0.0

        total_cobrado = (
            db.query(Pago)
            .join(Factura, Pago.factura_id == Factura.id)
            .filter(Factura.periodo == p)
            .with_entities(Pago.monto)
            .all()
        )
        total_cobrado = round(sum(m[0] for m in total_cobrado), 2)

        facturacion_historica.append(
            {"periodo": p, "facturado": total_facturado, "cobrado": total_cobrado}
        )

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