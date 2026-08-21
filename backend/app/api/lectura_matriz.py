import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import date
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.lectura_matriz import LecturaMatrizCreate, LecturaMatrizResponse, LecturaMatrizUpdate
from app.services import lectura_matriz as service
from app.services.storage import subir_foto_medidor, obtener_url_firmada

router = APIRouter(prefix="/lectura-matriz", tags=["Lectura Matriz"])

CONTENT_TYPES_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


@router.post("/", response_model=LecturaMatrizResponse)
async def crear_lectura_matriz(
    periodo: str = Form(...),
    fecha_lectura: date = Form(...),
    lectura_actual: float = Form(...),
    observaciones: str | None = Form(None),
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if foto.content_type not in CONTENT_TYPES_PERMITIDOS:
        raise HTTPException(
            status_code=400, detail="El archivo debe ser una imagen (jpg, png, webp)"
        )

    contenido = await foto.read()
    extension = foto.filename.split(".")[-1] if foto.filename and "." in foto.filename else "jpg"
    nombre_archivo = f"lectura-matriz/{periodo}/{uuid.uuid4().hex}.{extension}"
    try:
        foto_ruta = subir_foto_medidor(contenido, nombre_archivo, foto.content_type)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"No se pudo subir la foto: {e}")

    data = LecturaMatrizCreate(
        periodo=periodo,
        fecha_lectura=fecha_lectura,
        lectura_actual=lectura_actual,
        observaciones=observaciones,
    )
    try:
        return service.crear_lectura_matriz(db, data, foto_ruta=foto_ruta)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[LecturaMatrizResponse])
def listar_lecturas_matriz(db: Session = Depends(get_db)):
    return service.listar_lecturas_matriz(db)


@router.get("/comparativa-anual/{anio}")
def comparativa_anual(anio: str, db: Session = Depends(get_db)):
    return service.calcular_comparativa_anual(db, anio)


@router.get("/comparativa-total")
def comparativa_total(db: Session = Depends(get_db)):
    return service.calcular_comparativa_total(db)


@router.get("/comparativa/{periodo}")
def obtener_comparativa(periodo: str, db: Session = Depends(get_db)):
    return service.calcular_comparativa_agua(db, periodo)


@router.get("/comparativa-historica/")
def obtener_comparativa_historica(meses: int = 6, db: Session = Depends(get_db)):
    return service.calcular_comparativa_historica(db, meses)


@router.patch("/{lectura_id}", response_model=LecturaMatrizResponse)
def editar_lectura_matriz(lectura_id: int, data: LecturaMatrizUpdate, db: Session = Depends(get_db)):
    try:
        return service.actualizar_lectura_matriz(db, lectura_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{lectura_id}/foto")
def obtener_foto_lectura_matriz(lectura_id: int, db: Session = Depends(get_db)):
    from app.models.lectura_matriz import LecturaMatriz

    lectura = db.query(LecturaMatriz).filter(LecturaMatriz.id == lectura_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura matriz no encontrada")
    if not lectura.foto_ruta:
        raise HTTPException(status_code=404, detail="Esta lectura no tiene foto")
    try:
        url = obtener_url_firmada(lectura.foto_ruta)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"url": url}