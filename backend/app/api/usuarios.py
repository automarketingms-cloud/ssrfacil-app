from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioUpdate,
    UsuarioOut,
    CambioPasswordRequest,
)
from app.core.security import hash_password, verify_password
from app.core.deps import require_roles, get_current_user

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

CAMPOS_PERMITIDOS_ADMIN = {"nombre", "email", "activo", "rol"}
ROLES_PERMITIDOS_ADMIN_ASIGNA = {RolUsuario.OFICINA, RolUsuario.TERRENO}


@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN)),
):
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")

    if usuario_actual.rol == RolUsuario.SUPER_ADMIN:
        if data.empresa_id is None:
            raise HTTPException(
                status_code=400,
                detail="Como super_admin debes indicar empresa_id",
            )
        if data.rol == RolUsuario.SUPER_ADMIN:
            raise HTTPException(
                status_code=400,
                detail="No se pueden crear otros super_admin desde este endpoint",
            )
        empresa_id_final = data.empresa_id
    else:
        empresa_id_final = usuario_actual.empresa_id
        if data.rol in (RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN):
            raise HTTPException(
                status_code=403,
                detail="Un admin no puede crear otros admin ni super_admin",
            )

    nuevo = Usuario(
        empresa_id=empresa_id_final,
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[UsuarioOut])
def listar_usuarios(
    empresa_id: int | None = None,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(
        require_roles(RolUsuario.ADMIN, RolUsuario.OFICINA, RolUsuario.SUPER_ADMIN)
    ),
):
    query = db.query(Usuario)

    if usuario_actual.rol == RolUsuario.SUPER_ADMIN:
        if empresa_id is not None:
            query = query.filter(Usuario.empresa_id == empresa_id)
    else:
        query = query.filter(Usuario.empresa_id == usuario_actual.empresa_id)
        query = query.filter(Usuario.rol.notin_([RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN]))

    return query.order_by(Usuario.nombre).all()


@router.get("/me", response_model=UsuarioOut)
def mi_perfil(usuario_actual: Usuario = Depends(get_current_user)):
    return usuario_actual


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def cambiar_mi_password(
    data: CambioPasswordRequest,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    if not verify_password(data.password_actual, usuario_actual.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    usuario_actual.password_hash = hash_password(data.password_nueva)
    db.commit()
    return None


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def editar_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN)),
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = data.model_dump(exclude_unset=True)

    if usuario_actual.rol == RolUsuario.ADMIN:
        if usuario.empresa_id != usuario_actual.empresa_id or usuario.rol in (RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN):
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para modificar este usuario",
            )
        if not set(update_data.keys()) <= CAMPOS_PERMITIDOS_ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Como admin solo puedes modificar nombre, email, estado activo o rol",
            )
        if "rol" in update_data and update_data["rol"] not in ROLES_PERMITIDOS_ADMIN_ASIGNA:
            raise HTTPException(
                status_code=403,
                detail="Como admin solo puedes asignar el rol oficina o terreno",
            )

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario