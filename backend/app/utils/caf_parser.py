import xml.etree.ElementTree as ET
from fastapi import HTTPException


def parsear_caf(contenido_xml: bytes) -> dict:
    """
    Extrae los datos relevantes de un archivo CAF (.xml) entregado por el SII.
    Lanza HTTPException 400 si el XML no tiene la estructura esperada.
    """
    try:
        root = ET.fromstring(contenido_xml)
    except ET.ParseError:
        raise HTTPException(status_code=400, detail="El archivo no es un XML válido")

    da = root.find(".//DA")
    if da is None:
        raise HTTPException(status_code=400, detail="XML no parece ser un CAF válido (falta bloque DA)")

    try:
        tipo_dte = da.findtext("TD")
        rut_emisor = da.findtext("RE")
        folio_desde = int(da.find("RNG/D").text)
        folio_hasta = int(da.find("RNG/F").text)
    except (AttributeError, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="No se pudieron leer folio_desde/folio_hasta del CAF")

    if not tipo_dte or not rut_emisor:
        raise HTTPException(status_code=400, detail="CAF incompleto: falta tipo de documento o RUT emisor")

    return {
        "tipo_dte": tipo_dte,
        "rut_emisor": rut_emisor,
        "folio_desde": folio_desde,
        "folio_hasta": folio_hasta,
    }