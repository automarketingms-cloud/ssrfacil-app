# app/schemas/usuario.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from app.models.usuario import RolUsuario


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: RolUsuario


class UsuarioCreate(UsuarioBase):
    password: str = Field(min_length=8)
    empresa_id: int | None = None  # solo lo usa super_admin; admin lo ignora (hereda su propia empresa)


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    rol: RolUsuario | None = None
    activo: bool | None = None
    password: str | None = Field(default=None, min_length=8)


class UsuarioOut(UsuarioBase):
    id: int
    empresa_id: int | None
    activo: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut

class CambioPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str = Field(min_length=8)