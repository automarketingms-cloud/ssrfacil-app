from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.cliente import Cliente
from app.models.lectura import Lectura
from app.services.calculo_tarifa import (
    obtener_lectura_anterior,
    calcular_consumo,
    obtener_tarifa_vigente,
    calcular_total_a_pagar,
)
from app.services.configuracion import obtener_configuracion

router = APIRouter(prefix="/consumos", tags=["Consumos"])


@router.get("/{cliente_id}/{periodo}")
def obtener_consumo_y_cobro(cliente_id: int, periodo: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    lectura = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == cliente_id, Lectura.periodo == periodo)
        .first()
    )
    if not lectura:
        raise HTTPException(status_code=404, detail="No hay lectura registrada para este periodo")

    lectura_anterior = obtener_lectura_anterior(db, cliente_id, periodo)
    consumo = calcular_consumo(lectura.lectura_actual, lectura_anterior)

    try:
        tarifa = obtener_tarifa_vigente(db, periodo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    config = obtener_configuracion(db)
    desglose = calcular_total_a_pagar(consumo, tarifa, cliente, config.tasa_iva)

    return {
        "cliente_id": cliente.id,
        "nombre_cliente": cliente.nombre,
        "es_socio": cliente.es_socio,
        "periodo": periodo,
        "lectura_anterior": lectura_anterior,
        "lectura_actual": lectura.lectura_actual,
        "consumo_m3": consumo,
        "tarifa_aplicada": tarifa.nombre,
        **desglose,
    }


@router.get("/")
def resumen_mensual(periodo: str, db: Session = Depends(get_db)):
    """
    Devuelve el consumo y cobro de TODOS los clientes para un periodo dado.
    """
    lecturas = db.query(Lectura).filter(Lectura.periodo == periodo).all()

    try:
        tarifa = obtener_tarifa_vigente(db, periodo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    config = obtener_configuracion(db)

    resultado = []
    for lectura in lecturas:
        cliente = db.query(Cliente).filter(Cliente.id == lectura.cliente_id).first()
        if not cliente:
            continue

        lectura_anterior = obtener_lectura_anterior(db, lectura.cliente_id, periodo)
        consumo = calcular_consumo(lectura.lectura_actual, lectura_anterior)
        desglose = calcular_total_a_pagar(consumo, tarifa, cliente, config.tasa_iva)

        resultado.append({
            "cliente_id": cliente.id,
            "nombre_cliente": cliente.nombre,
            "es_socio": cliente.es_socio,
            "periodo": periodo,
            "lectura_anterior": lectura_anterior,
            "lectura_actual": lectura.lectura_actual,
            "consumo_m3": consumo,
            "tarifa_aplicada": tarifa.nombre,
            **desglose,
        })

    return resultado