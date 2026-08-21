import re


def _limpiar_rut(rut: str) -> str:
    """Deja solo dígitos y k/K, en mayúscula."""
    return re.sub(r"[^0-9kK]", "", rut).upper()


def _calcular_dv(cuerpo: str) -> str:
    """Calcula el dígito verificador esperado para un cuerpo de RUT (sin puntos ni guion)."""
    suma = 0
    multiplicador = 2
    for digito in reversed(cuerpo):
        suma += int(digito) * multiplicador
        multiplicador = 2 if multiplicador == 7 else multiplicador + 1

    resto = 11 - (suma % 11)
    if resto == 11:
        return "0"
    if resto == 10:
        return "K"
    return str(resto)


def validar_rut(rut: str) -> bool:
    """Valida un RUT chileno (acepta con o sin puntos/guion)."""
    limpio = _limpiar_rut(rut)
    if len(limpio) < 2:
        return False

    cuerpo, dv = limpio[:-1], limpio[-1]

    if not cuerpo.isdigit():
        return False

    return _calcular_dv(cuerpo) == dv