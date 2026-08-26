from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.empresa import Empresa
from app.models.usuario import Usuario, RolUsuario
from app.models.configuracion import Configuracion
from app.schemas.empresa import EmpresaCreate, EmpresaOut
from app.core.security import hash_password
from app.core.deps import require_roles

router = APIRouter(prefix="/empresas", tags=["empresas"])


@router.post("/", response_model=EmpresaOut, status_code=status.HTTP_201_CREATED)
def crear_empresa(
    data: EmpresaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.SUPER_ADMIN)),
):
    if db.query(Usuario).filter(Usuario.email == data.admin_email).first():
        raise HTTPException(status_code=400, detail="Ese email de admin ya está en uso")

    empresa = Empresa(nombre=data.nombre, rut=data.rut)
    db.add(empresa)
    db.commit()
    db.refresh(empresa)

    admin = Usuario(
        empresa_id=empresa.id,
        nombre=data.admin_nombre,
        email=data.admin_email,
        password_hash=hash_password(data.admin_password),
        rol=RolUsuario.ADMIN,
    )
    db.add(admin)

    configuracion = Configuracion(
        empresa_id=empresa.id,
        nombre_empresa=empresa.nombre,
        rut_empresa=empresa.rut,
    )
    db.add(configuracion)

    db.commit()

    return empresa


@router.get("/", response_model=list[EmpresaOut])
def listar_empresas(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.SUPER_ADMIN)),
):
    return db.query(Empresa).order_by(Empresa.nombre).all()