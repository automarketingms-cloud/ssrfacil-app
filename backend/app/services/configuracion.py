from sqlalchemy.orm import Session
from app.models.configuracion import Configuracion
from app.schemas.configuracion import ConfiguracionUpdate


def obtener_configuracion(db: Session, empresa_id: int) -> Configuracion:
    """
    Devuelve la configuración de la empresa indicada.
    Si no existe todavía (no debería pasar si se crea junto con la empresa),
    la crea con valores default.
    """
    config = db.query(Configuracion).filter(Configuracion.empresa_id == empresa_id).first()

    if config is None:
        config = Configuracion(empresa_id=empresa_id)  # usa los defaults definidos en el modelo
        db.add(config)
        db.commit()
        db.refresh(config)

    return config


def actualizar_configuracion(db: Session, empresa_id: int, datos: ConfiguracionUpdate) -> Configuracion:
    """
    Actualiza la configuración de la empresa indicada.
    Si no existe, la crea primero y luego aplica los cambios.
    """
    config = obtener_configuracion(db, empresa_id)

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(config, campo, valor)

    db.commit()
    db.refresh(config)
    return config