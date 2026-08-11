from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.dashboard import construir_resumen_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/resumen")
def obtener_resumen_dashboard(periodo: str, db: Session = Depends(get_db)):
    return construir_resumen_dashboard(db, periodo)