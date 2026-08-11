from sqlalchemy.orm import Session
from app.models.configuracion import Configuracion
from app.schemas.configuracion import ConfiguracionUpdate


def obtener_configuracion(db: Session) -> Configuracion:
    """
    Devuelve la fila única de configuración.
    Si no existe todavía (primera vez que se usa el sistema), la crea con valores default.
    """
    config = db.query(Configuracion).filter(Configuracion.id == 1).first()

    if config is None:
        config = Configuracion(id=1)  # usa los defaults definidos en el modelo
        db.add(config)
        db.commit()
        db.refresh(config)

    return config


def actualizar_configuracion(db: Session, datos: ConfiguracionUpdate) -> Configuracion:
    """
    Actualiza la fila única de configuración.
    Si no existe, la crea primero y luego aplica los cambios.
    """
    config = obtener_configuracion(db)

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(config, campo, valor)

    db.commit()
    db.refresh(config)
    return config