from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lectura import Lectura
from app.models.cliente import Cliente
from app.schemas.lectura import LecturaCreate, LecturaUpdate, LecturaResponse
from app.services.facturacion import obtener_lectura_anterior, calcular_consumo

router = APIRouter(prefix="/lecturas", tags=["Lecturas"])


@router.post("/", response_model=LecturaResponse)
def crear_lectura(lectura: LecturaCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == lectura.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not cliente.activo:
        raise HTTPException(
            status_code=400,
            detail="No se pueden ingresar lecturas para un cliente inactivo",
        )

    ya_existe = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == lectura.cliente_id, Lectura.periodo == lectura.periodo)
        .first()
    )
    if ya_existe:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una lectura para este cliente en este periodo",
        )

    lectura_anterior = obtener_lectura_anterior(db, lectura.cliente_id, lectura.periodo)

    try:
        consumo = calcular_consumo(lectura.lectura_actual, lectura_anterior)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    nueva_lectura = Lectura(**lectura.model_dump())
    db.add(nueva_lectura)
    db.commit()
    db.refresh(nueva_lectura)

    return {**nueva_lectura.__dict__, "consumo_m3": consumo}


@router.get("/", response_model=list[LecturaResponse])
def listar_lecturas(cliente_id: int = None, db: Session = Depends(get_db)):
    """Historial de lecturas. Si se pasa cliente_id, filtra por ese cliente."""
    query = db.query(Lectura)
    if cliente_id:
        query = query.filter(Lectura.cliente_id == cliente_id)
    lecturas = query.order_by(Lectura.periodo.desc()).all()

    resultado = []
    for l in lecturas:
        lectura_anterior = obtener_lectura_anterior(db, l.cliente_id, l.periodo)
        try:
            consumo = calcular_consumo(l.lectura_actual, lectura_anterior)
        except ValueError:
            # lectura con inconsistencia (ej. anterior > actual) - la mostramos
            # igual en el historial, pero sin consumo calculado
            consumo = None
        resultado.append({**l.__dict__, "consumo_m3": consumo})
    return resultado


@router.get("/{lectura_id}", response_model=LecturaResponse)
def obtener_lectura(lectura_id: int, db: Session = Depends(get_db)):
    """Detalle de una lectura puntual (útil para precargar el form de edición)."""
    lectura = db.query(Lectura).filter(Lectura.id == lectura_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")

    lectura_anterior = obtener_lectura_anterior(db, lectura.cliente_id, lectura.periodo)
    try:
        consumo = calcular_consumo(lectura.lectura_actual, lectura_anterior)
    except ValueError:
        consumo = None

    return {**lectura.__dict__, "consumo_m3": consumo}


@router.patch("/{lectura_id}", response_model=LecturaResponse)
def editar_lectura(lectura_id: int, datos: LecturaUpdate, db: Session = Depends(get_db)):
    lectura = db.query(Lectura).filter(Lectura.id == lectura_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")

    datos_actualizados = datos.model_dump(exclude_unset=True)

    nuevo_periodo = datos_actualizados.get("periodo", lectura.periodo)
    nueva_lectura_actual = datos_actualizados.get("lectura_actual", lectura.lectura_actual)

    # si cambia el periodo, evita choque con otra lectura del mismo cliente
    if nuevo_periodo != lectura.periodo:
        ya_existe = (
            db.query(Lectura)
            .filter(
                Lectura.cliente_id == lectura.cliente_id,
                Lectura.periodo == nuevo_periodo,
                Lectura.id != lectura_id,
            )
            .first()
        )
        if ya_existe:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una lectura para este cliente en ese periodo",
            )

    # valida ANTES de tocar la BD, para no dejar datos inconsistentes guardados
    lectura_anterior = obtener_lectura_anterior(db, lectura.cliente_id, nuevo_periodo)
    try:
        consumo = calcular_consumo(nueva_lectura_actual, lectura_anterior)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    for campo, valor in datos_actualizados.items():
        setattr(lectura, campo, valor)

    db.commit()
    db.refresh(lectura)

    return {**lectura.__dict__, "consumo_m3": consumo}