from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tarifa import Tarifa, TarifaTramo
from app.models.lectura import Lectura
from app.schemas.tarifa import TarifaCreate, TarifaResponse

from datetime import date
from app.services.facturacion import obtener_tarifa_vigente

router = APIRouter(prefix="/tarifas", tags=["Tarifas"])


@router.post("/", response_model=TarifaResponse)
def crear_tarifa(tarifa: TarifaCreate, db: Session = Depends(get_db)):
    nueva_tarifa = Tarifa(
        nombre=tarifa.nombre,
        cargo_fijo=tarifa.cargo_fijo,
        valor_fondo_reposicion=tarifa.valor_fondo_reposicion,
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

@router.get("/{tarifa_id}", response_model=TarifaResponse)
def obtener_tarifa(tarifa_id: int, db: Session = Depends(get_db)):
    tarifa = db.query(Tarifa).filter(Tarifa.id == tarifa_id).first()
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    return tarifa


@router.delete("/{tarifa_id}")
def eliminar_tarifa(tarifa_id: int, db: Session = Depends(get_db)):
    tarifa = db.query(Tarifa).filter(Tarifa.id == tarifa_id).first()
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")

    # Solo se puede eliminar la tarifa más reciente (evita borrar historial)
    tarifa_mas_reciente = (
        db.query(Tarifa).order_by(Tarifa.vigente_desde.desc()).first()
    )
    if tarifa_mas_reciente.id != tarifa.id:
        raise HTTPException(
            status_code=400,
            detail="Solo se puede eliminar la tarifa vigente más reciente",
        )

    # Verifica que no exista ninguna lectura cuyo período ya caiga
    # dentro del rango de vigencia de esta tarifa
    periodo_desde = tarifa.vigente_desde.strftime("%Y-%m")
    lectura_asociada = (
        db.query(Lectura).filter(Lectura.periodo >= periodo_desde).first()
    )
    if lectura_asociada:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: ya existen lecturas facturadas con esta tarifa",
        )

    db.delete(tarifa)
    db.commit()
    return {"detail": "Tarifa eliminada correctamente"}