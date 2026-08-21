import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lectura import Lectura
from app.models.cliente import Cliente
from app.models.factura import Factura
from app.schemas.lectura import LecturaUpdate, LecturaResponse, LecturaTerminoMedioCreate, LecturaListResponse
from app.services.calculo_tarifa import (
    obtener_lectura_anterior,
    calcular_consumo,
    calcular_consumo_promedio,
    validar_periodo_no_futuro,
)
from app.services.storage import subir_foto_medidor, obtener_url_firmada
from fastapi.responses import StreamingResponse
from app.services.ruta_lectura import construir_ruta_lectura, construir_excel_ruta_lectura, construir_pdf_ruta_lectura


router = APIRouter(prefix="/lecturas", tags=["Lecturas"])

CONTENT_TYPES_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


@router.post("/", response_model=LecturaResponse)
async def crear_lectura(
    cliente_id: int = Form(...),
    fecha_lectura: date = Form(...),
    periodo: str = Form(...),
    lectura_actual: float = Form(...),
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if foto.content_type not in CONTENT_TYPES_PERMITIDOS:
        raise HTTPException(
            status_code=400, detail="El archivo debe ser una imagen (jpg, png, webp)"
        )

    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not cliente.activo:
        raise HTTPException(
            status_code=400,
            detail="No se pueden ingresar lecturas para un cliente inactivo",
        )
    try:
        validar_periodo_no_futuro(periodo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

    ya_existe = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == cliente_id, Lectura.periodo == periodo)
        .first()
    )
    if ya_existe:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una lectura para este cliente en este periodo",
        )
    

    lectura_anterior_obj = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == cliente_id, Lectura.periodo < periodo)
        .order_by(Lectura.periodo.desc())
        .first()
    )
    lectura_anterior = lectura_anterior_obj.lectura_actual if lectura_anterior_obj else 0.0
    viene_de_termino_medio = bool(lectura_anterior_obj and lectura_anterior_obj.es_promedio)

    try:
        consumo = calcular_consumo(
            lectura_actual, lectura_anterior, permitir_negativo=viene_de_termino_medio
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Se sube la foto ANTES de guardar la lectura: si falla la subida, no
    # queda una lectura sin respaldo fotográfico guardada a medias.
    contenido = await foto.read()
    extension = foto.filename.split(".")[-1] if foto.filename and "." in foto.filename else "jpg"
    nombre_archivo = f"lecturas/{periodo}/cliente_{cliente_id}_{uuid.uuid4().hex}.{extension}"
    try:
        foto_ruta = subir_foto_medidor(contenido, nombre_archivo, foto.content_type)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"No se pudo subir la foto: {e}")

    nueva_lectura = Lectura(
        cliente_id=cliente_id,
        fecha_lectura=fecha_lectura,
        periodo=periodo,
        lectura_actual=lectura_actual,
        foto_ruta=foto_ruta,
    )
    db.add(nueva_lectura)
    db.commit()
    db.refresh(nueva_lectura)

    return {**nueva_lectura.__dict__, "consumo_m3": consumo, "tiene_foto": True}


@router.get("/", response_model=LecturaListResponse)
def listar_lecturas(
    cliente_id: int | None = None,
    periodo: str | None = None,
    anio: str | None = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Lectura)
    if cliente_id:
        query = query.filter(Lectura.cliente_id == cliente_id)
    if periodo:
        query = query.filter(Lectura.periodo == periodo)
    elif anio:
        query = query.filter(Lectura.periodo.like(f"{anio}-%"))

    total = query.count()
    lecturas = (
        query.order_by(Lectura.periodo.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    # Una sola query para saber cuáles (cliente_id, periodo) de esta página
    # ya tienen factura, evita N+1 por fila.
    pares = {(l.cliente_id, l.periodo) for l in lecturas}
    facturadas = set()
    if pares:
        cliente_ids = {p[0] for p in pares}
        periodos = {p[1] for p in pares}
        facturas_relevantes = (
            db.query(Factura.cliente_id, Factura.periodo)
            .filter(Factura.cliente_id.in_(cliente_ids), Factura.periodo.in_(periodos))
            .all()
        )
        facturadas = {(f.cliente_id, f.periodo) for f in facturas_relevantes}

    resultado = []
    for l in lecturas:
        lectura_anterior_obj = (
            db.query(Lectura)
            .filter(Lectura.cliente_id == l.cliente_id, Lectura.periodo < l.periodo)
            .order_by(Lectura.periodo.desc())
            .first()
        )
        lectura_anterior = lectura_anterior_obj.lectura_actual if lectura_anterior_obj else 0.0
        viene_de_termino_medio = bool(lectura_anterior_obj and lectura_anterior_obj.es_promedio)
        try:
            consumo = calcular_consumo(
                l.lectura_actual, lectura_anterior, permitir_negativo=viene_de_termino_medio
            )
        except ValueError:
            consumo = None
        resultado.append(
            {
                **l.__dict__,
                "consumo_m3": consumo,
                "tiene_foto": l.foto_ruta is not None,
                "facturada": (l.cliente_id, l.periodo) in facturadas,
            }
        )

    return {"items": resultado, "total": total, "page": page, "limit": limit}

@router.get("/ruta", response_model=dict)
def obtener_ruta_lectura(
    estado: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Listado de clientes del período actual con su estado de lectura,
    para el trabajador de terreno. estado: pendiente | leido | (vacío = todos)
    """
    return construir_ruta_lectura(db, estado)

@router.get("/ruta/excel")
def descargar_ruta_lectura_excel(db: Session = Depends(get_db)):
    buffer = construir_excel_ruta_lectura(db)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ruta_lectura.xlsx"},
    )


@router.get("/ruta/pdf")
def descargar_ruta_lectura_pdf(db: Session = Depends(get_db)):
    buffer = construir_pdf_ruta_lectura(db)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ruta_lectura.pdf"},
    )


@router.get("/{lectura_id}", response_model=LecturaResponse)
def obtener_lectura(lectura_id: int, db: Session = Depends(get_db)):
    lectura = db.query(Lectura).filter(Lectura.id == lectura_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")

    factura_existente = (
        db.query(Factura)
        .filter(Factura.cliente_id == lectura.cliente_id, Factura.periodo == lectura.periodo)
        .first()
    )

    lectura_anterior_obj = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == lectura.cliente_id, Lectura.periodo < lectura.periodo)
        .order_by(Lectura.periodo.desc())
        .first()
    )
    lectura_anterior = lectura_anterior_obj.lectura_actual if lectura_anterior_obj else 0.0
    viene_de_termino_medio = bool(lectura_anterior_obj and lectura_anterior_obj.es_promedio)
    try:
        consumo = calcular_consumo(
            lectura.lectura_actual, lectura_anterior, permitir_negativo=viene_de_termino_medio
        )
    except ValueError:
        consumo = None

    return {
        **lectura.__dict__,
        "consumo_m3": consumo,
        "tiene_foto": lectura.foto_ruta is not None,
        "facturada": factura_existente is not None,
    }

@router.get("/{lectura_id}/foto")
def obtener_foto_lectura(lectura_id: int, db: Session = Depends(get_db)):
    lectura = db.query(Lectura).filter(Lectura.id == lectura_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")
    if not lectura.foto_ruta:
        raise HTTPException(status_code=404, detail="Esta lectura no tiene foto")
    try:
        url = obtener_url_firmada(lectura.foto_ruta)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"url": url}


@router.patch("/{lectura_id}", response_model=LecturaResponse)
def editar_lectura(lectura_id: int, datos: LecturaUpdate, db: Session = Depends(get_db)):
    lectura = db.query(Lectura).filter(Lectura.id == lectura_id).first()
    if not lectura:
        raise HTTPException(status_code=404, detail="Lectura no encontrada")

    factura_existente = (
        db.query(Factura)
        .filter(
            Factura.cliente_id == lectura.cliente_id,
            Factura.periodo == lectura.periodo,
        )
        .first()
    )
    if factura_existente:
        raise HTTPException(
            status_code=400,
            detail="No se puede editar esta lectura porque el período ya fue facturado",
        )

    datos_actualizados = datos.model_dump(exclude_unset=True)

    nuevo_periodo = datos_actualizados.get("periodo", lectura.periodo)
    nueva_lectura_actual = datos_actualizados.get("lectura_actual", lectura.lectura_actual)

    if nuevo_periodo != lectura.periodo:
        try:
            validar_periodo_no_futuro(nuevo_periodo)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        ya_existe = (
            db.query(Lectura)
            .filter(
                Lectura.cliente_id == lectura.cliente_id,
                Lectura.periodo == nuevo_periodo,
                Lectura.id != lectura_id,
            )
            .first()
        )
        if ya_existe:
            raise HTTPException(
                status_code=400,
                detail="Ya existe una lectura para este cliente en ese periodo",
            )

    lectura_anterior = obtener_lectura_anterior(db, lectura.cliente_id, nuevo_periodo)
    try:
        consumo = calcular_consumo(nueva_lectura_actual, lectura_anterior)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    for campo, valor in datos_actualizados.items():
        setattr(lectura, campo, valor)

    db.commit()
    db.refresh(lectura)

    return {**lectura.__dict__, "consumo_m3": consumo, "tiene_foto": lectura.foto_ruta is not None}


@router.post("/termino-medio", response_model=LecturaResponse)
def crear_lectura_termino_medio(datos: LecturaTerminoMedioCreate, db: Session = Depends(get_db)):
    """
    Registra una lectura estimada por término medio (Cap. 4 manual SISS),
    para cuando no se pudo leer el medidor de un cliente en el período.
    No requiere foto: no hubo medición real que respaldar.
    """
    cliente = db.query(Cliente).filter(Cliente.id == datos.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not cliente.activo:
        raise HTTPException(
            status_code=400,
            detail="No se pueden ingresar lecturas para un cliente inactivo",
        )
    try:
        validar_periodo_no_futuro(datos.periodo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    ya_existe = (
        db.query(Lectura)
        .filter(Lectura.cliente_id == datos.cliente_id, Lectura.periodo == datos.periodo)
        .first()
    )
    if ya_existe:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una lectura para este cliente en este periodo",
        )

    lectura_anterior = obtener_lectura_anterior(db, datos.cliente_id, datos.periodo)

    try:
        consumo_promedio, meses_considerados = calcular_consumo_promedio(
            db, datos.cliente_id, datos.periodo
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    nueva_lectura = Lectura(
        cliente_id=datos.cliente_id,
        fecha_lectura=datos.fecha_lectura,
        periodo=datos.periodo,
        lectura_actual=lectura_anterior + consumo_promedio,
        es_promedio=True,
    )
    db.add(nueva_lectura)
    db.commit()
    db.refresh(nueva_lectura)

    return {**nueva_lectura.__dict__, "consumo_m3": consumo_promedio, "tiene_foto": False}