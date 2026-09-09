from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.usuario import Usuario, RolUsuario
from app.services.dashboard import construir_resumen_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/resumen")
def obtener_resumen_dashboard(
    periodo: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA, RolUsuario.TERRENO)
    ),
):
    return construir_resumen_dashboard(db, periodo, current_user.empresa_id)