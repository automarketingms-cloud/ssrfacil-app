from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class EmpresaCreate(BaseModel):
    nombre: str
    rut: str | None = None
    # datos del admin inicial de esa empresa
    admin_nombre: str
    admin_email: EmailStr
    admin_password: str = Field(min_length=8)


class EmpresaOut(BaseModel):
    id: int
    nombre: str
    rut: str | None
    activa: bool
    fecha_creacion: datetime

    class Config:
        from_attributes = True