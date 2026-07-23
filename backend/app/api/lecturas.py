from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lectura import Lectura
from app.models.cliente import Cliente
from app.schemas.lectura import LecturaCreate, LecturaResponse
from app.services.facturacion import obtener_lectura_anterior, calcular_consumo

router = APIRouter(prefix="/lecturas", tags=["Lecturas"])


@router.post("/", response_model=LecturaResponse)
def crear_lectura(lectura: LecturaCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == lectura.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

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
    query = db.query(Lectura)
    if cliente_id:
        query = query.filter(Lectura.cliente_id == cliente_id)
    lecturas = query.order_by(Lectura.periodo.desc()).all()

    resultado = []
    for l in lecturas:
        anterior = obtener_lectura_anterior(db, l.cliente_id, l.periodo)
        resultado.append({**l.__dict__, "consumo_m3": l.lectura_actual - anterior})
    return resultado