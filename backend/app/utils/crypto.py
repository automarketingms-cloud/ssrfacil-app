import os
from cryptography.fernet import Fernet

def _get_fernet() -> Fernet:
    clave = os.getenv("CERTIFICADO_ENCRYPTION_KEY")
    if not clave:
        raise RuntimeError(
            "Falta la variable de entorno CERTIFICADO_ENCRYPTION_KEY. "
            "Generar una con: Fernet.generate_key()"
        )
    return Fernet(clave.encode())


def encriptar(texto_plano: str) -> str:
    return _get_fernet().encrypt(texto_plano.encode()).decode()


def desencriptar(texto_encriptado: str) -> str:
    return _get_fernet().decrypt(texto_encriptado.encode()).decode()