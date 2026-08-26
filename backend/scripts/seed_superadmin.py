from app.core.database import SessionLocal
from app.models.empresa import Empresa  # necesario para que SQLAlchemy resuelva el relationship en Usuario
from app.models.usuario import Usuario, RolUsuario
from app.core.security import hash_password

db = SessionLocal()

super_admin = Usuario(
    empresa_id=None,
    nombre="Super Admin",
    email="ms.lopez94@hotmail.com",
    password_hash=hash_password("187810094m"),
    rol=RolUsuario.SUPER_ADMIN,
)
db.add(super_admin)
db.commit()

print(f"Super admin creado: {super_admin.email}")