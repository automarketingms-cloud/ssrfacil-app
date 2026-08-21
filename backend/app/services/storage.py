import os
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET = "fotos-medidores"


def subir_foto_medidor(contenido: bytes, nombre_archivo: str, content_type: str) -> str:
    """
    Sube la foto al bucket privado de Supabase Storage.
    Devuelve la ruta interna del archivo (NO una URL pública, porque el
    bucket es privado) para guardar en la BD.
    """
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{nombre_archivo}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": content_type,
    }
    respuesta = httpx.post(url, headers=headers, content=contenido, timeout=30.0)
    if respuesta.status_code not in (200, 201):
        raise ValueError(f"Error al subir la foto a Supabase Storage: {respuesta.text}")
    return nombre_archivo


def obtener_url_firmada(ruta_archivo: str, expira_segundos: int = 3600) -> str:
    """
    Genera una URL firmada temporal para ver una foto guardada en el
    bucket privado. Se llama al vuelo cada vez que el frontend necesita
    mostrar la imagen (no se guarda la URL firmada en la BD, porque expira).
    """
    url = f"{SUPABASE_URL}/storage/v1/object/sign/{BUCKET}/{ruta_archivo}"
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