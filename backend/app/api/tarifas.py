from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tarifa import Tarifa, TarifaTramo
from app.schemas.tarifa import TarifaCreate, TarifaResponse

from datetime import date
from app.services.facturacion import obtener_tarifa_vigente

router = APIRouter(prefix="/tarifas", tags=["Tarifas"])


@router.post("/", response_model=TarifaResponse)
def crear_tarifa(tarifa: TarifaCreate, db: Session = Depends(get_db)):
    nueva_tarifa = Tarifa(
        nombre=tarifa.nombre,
        cargo_fijo=tarifa.cargo_fijo,
        vigente_desde=tarifa.vigente_desde,
    )
    db.add(nueva_tarifa)
    db.flush()  # asigna el id antes de crear los tramos

    for t in tarifa.tramos:
        nuevo_tramo = TarifaTramo(tarifa_id=nueva_tarifa.id, **t.model_dump())
        db.add(nuevo_tramo)

    db.commit()
    db.refresh(nueva_tarifa)
    return nueva_tarifa


@router.get("/", response_model=list[TarifaResponse])
def listar_tarifas(db: Session = Depends(get_db)):
    return db.query(Tarifa).order_by(Tarifa.vigente_desde.desc()).all()


@router.get("/vigente", response_model=TarifaResponse)
def obtener_tarifa_actual(db: Session = Depends(get_db)):
    hoy = date.today().strftime("%Y-%m")
    try:
        return obtener_tarifa_vigente(db, hoy)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))