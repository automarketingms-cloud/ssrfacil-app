from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class HistorialEdicionResponse(BaseModel):
    id: int
    usuario_id: int
    usuario_nombre: Optional[str] = None
    fecha: datetime
    cambios: dict[str, dict[str, Any]]

    class Config:
        from_attributes = True