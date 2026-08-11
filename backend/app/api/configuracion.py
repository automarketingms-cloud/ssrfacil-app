from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db  # ajusta al nombre real de tu dependencia de sesión
from app.schemas.configuracion import ConfiguracionResponse, ConfiguracionUpdate
from app.services import configuracion as configuracion_service

router = APIRouter(prefix="/configuracion", tags=["configuracion"])


@router.get("/", response_model=ConfiguracionResponse)
def obtener_configuracion(db: Session = Depends(get_db)):
    return configuracion_service.obtener_configuracion(db)


@router.put("/", response_model=ConfiguracionResponse)
def actualizar_configuracion(
    datos: ConfiguracionUpdate,
    db: Session = Depends(get_db)
):
    return configuracion_service.actualizar_configuracion(db, datos)