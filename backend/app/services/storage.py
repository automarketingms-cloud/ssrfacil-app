import os
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_FOTOS_MEDIDORES = "fotos-medidores"
BUCKET_CAF_SII = "caf-sii"


def subir_archivo(bucket: str, contenido: bytes, nombre_archivo: str, content_type: str) -> str:
    """
    Sube un archivo a un bucket privado de Supabase Storage.
    Devuelve la ruta interna del archivo (NO una URL pública) para guardar en la BD.
    """
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{nombre_archivo}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": content_type,
    }
    respuesta = httpx.post(url, headers=headers, content=contenido, timeout=30.0)
    if respuesta.status_code not in (200, 201):
        raise ValueError(f"Error al subir el archivo a Supabase Storage: {respuesta.text}")
    return nombre_archivo


def obtener_url_firmada(ruta_archivo: str, bucket: str = BUCKET_FOTOS_MEDIDORES, expira_segundos: int = 3600) -> str:
    """
    Genera una URL firmada temporal para ver un archivo guardado en un
    bucket privado. Se llama al vuelo cada vez que el frontend necesita
    mostrar el archivo (no se guarda la URL firmada en la BD, porque expira).
    """
    url = f"{SUPABASE_URL}/storage/v1/object/sign/{bucket}/{ruta_archivo}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
    }
    respuesta = httpx.post(
        url, headers=headers, json={"expiresIn": expira_segundos}, timeout=30.0
    )
    if respuesta.status_code != 200:
        raise ValueError(f"Error al generar URL firmada: {respuesta.text}")
    signed_path = respuesta.json()["signedURL"]
    return f"{SUPABASE_URL}/storage/v1{signed_path}"


def subir_foto_medidor(contenido: bytes, nombre_archivo: str, content_type: str) -> str:
    """Mantiene la firma anterior para no tocar los llamados existentes."""
    return subir_archivo(BUCKET_FOTOS_MEDIDORES, contenido, nombre_archivo, content_type)


def descargar_archivo(bucket: str, ruta_archivo: str) -> bytes:
    """
    Descarga el contenido crudo de un archivo desde un bucket privado
    de Supabase Storage. Usado para adjuntar archivos (certificado, CAF)
    directamente en requests salientes, sin pasar por una URL firmada.
    """
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{ruta_archivo}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
    }
    respuesta = httpx.get(url, headers=headers, timeout=30.0)
    if respuesta.status_code != 200:
        raise ValueError(f"Error al descargar el archivo de Supabase Storage: {respuesta.text}")
    return respuesta.content