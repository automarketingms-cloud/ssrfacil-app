from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from datetime import date

from app.core.database import get_db
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteResponse, ClienteCreate, ClienteUpdate, ClienteListResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post("/", response_model=ClienteResponse)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    datos = cliente.model_dump()
    datos["fecha_ingreso"] = date.today()

    nuevo_cliente = Cliente(**datos)
    db.add(nuevo_cliente)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El RUT o numero de medidor ya esta registrado")
    db.refresh(nuevo_cliente)
    return nuevo_cliente

@router.get("/", response_model=ClienteListResponse)
def listar_clientes(
    activo: bool | None = None,
    es_socio: bool | None = None,
    q: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Cliente)
    if activo is not None:
        query = query.filter(Cliente.activo == activo)
    if es_socio is not None:
        query = query.filter(Cliente.es_socio == es_socio)
    if q:
        termino = f"%{q}%"
        query = query.filter(
            or_(Cliente.nombre.ilike(termino), Cliente.rut.ilike(termino))
        )

    total = query.count()
    clientes = (
        query.order_by(Cliente.nombre)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {"items": clientes, "total": total, "page": page, "limit": limit}


@router.get("/buscar/{rut}", response_model=ClienteResponse)
def buscar_por_rut(rut: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.rut == rut).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.patch("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, datos: ClienteUpdate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    datos_actualizados = datos.model_dump(exclude_unset=True)  # solo lo que vino en el body
    for campo, valor in datos_actualizados.items():
        setattr(cliente, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El RUT o numero de medidor ya esta registrado")
    db.refresh(cliente)
    return cliente


@router.patch("/{cliente_id}/desactivar", response_model=ClienteResponse)
def desactivar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente.activo = False
    db.commit()
    db.refresh(cliente)
    return cliente


@router.patch("/{cliente_id}/reactivar", response_model=ClienteResponse)
def reactivar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente.activo = True
    db.commit()
    db.refresh(cliente)
    return cliente