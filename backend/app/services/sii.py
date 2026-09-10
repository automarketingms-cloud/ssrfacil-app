import os
import json
import httpx
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.utils.crypto import desencriptar

from app.models.factura import Factura
from app.models.configuracion import Configuracion
from app.services import caf as caf_service
from app.services.storage import descargar_archivo, BUCKET_CAF_SII

SIMPLEAPI_BASE_URL = os.getenv("SIMPLEAPI_BASE_URL")
BUCKET_CERTIFICADOS = "certificados-sii"
SIMPLEAPI_API_KEY = os.getenv("SIMPLEAPI_API_KEY")


def _construir_emisor(config: Configuracion) -> dict:
    return {
        "Rut": config.rut_empresa,
        "RazonSocial": config.nombre_empresa,
        "Giro": config.giro,
        "ActividadEconomica": config.actividad_economica or [],
        "DireccionOrigen": config.direccion,
        "ComunaOrigen": config.comuna or "",
        "Telefono": [config.telefono] if config.telefono else [],
    }


def _construir_receptor(factura: Factura) -> dict:
    cliente = factura.cliente
    es_factura = factura.tipo_dte in ("33", "34")
    return {
        "Rut": cliente.rut,
        "RazonSocial": cliente.nombre,
        "Direccion": cliente.direccion or "",
        "Comuna": (cliente.comuna or "") if es_factura else "",
        "Giro": (cliente.giro or "") if es_factura else "",
        "Contacto": "",
    }


def _construir_totales_y_recargos(factura: Factura) -> tuple[dict, list]:
    """
    Separa el consumo del período (neto + IVA, si aplica) del arrastre de
    deuda anterior. Para tipos exentos (34/41) MontoExento lleva el neto
    y MontoNeto/IVA quedan en 0, según lo que exige el esquema SII.
    Asunción: saldo_anterior + interes_mora van como recargo aparte, sin
    IVA adicional (la mora no genera IVA, y el saldo_anterior ya tributó
    IVA cuando se emitió su boleta original). Confirmar este criterio
    antes de ir a producción.
    """
    es_exento = factura.tipo_dte in ("34", "41")

    monto_neto_o_exento = round(
        factura.cargo_fijo
        + factura.monto_variable
        + factura.cargo_fondo_reposicion
        - factura.subsidio_aplicado
    )
    recargo = round(factura.saldo_anterior + factura.interes_mora)

    totales = {
        "MontoNeto": 0 if es_exento else monto_neto_o_exento,
        "MontoExento": monto_neto_o_exento if es_exento else 0,
        "TasaIVA": 0 if es_exento else 19,
        "IVA": round(factura.iva),
        "MontoTotal": round(factura.total_a_pagar),
    }

    descuentos_recargos = []
    if recargo > 0:
        descuentos_recargos.append({
            "TipoMovimiento": "Recargo",
            "Descripcion": "Saldo anterior e interés por mora",
            "TipoValor": "Pesos",
            "Valor": recargo,
        })

    return totales, descuentos_recargos


def _construir_documento(factura: Factura, config: Configuracion, folio: int, password_certificado: str) -> dict:
    totales, descuentos_recargos = _construir_totales_y_recargos(factura)
    es_exento = factura.tipo_dte in ("34", "41")
    monto_item = totales["MontoExento"] if es_exento else totales["MontoNeto"]

    return {
        "Documento": {
            "Encabezado": {
                "IdentificacionDTE": {
                    "TipoDTE": int(factura.tipo_dte),
                    "Folio": folio,
                    "FechaEmision": factura.fecha_emision.isoformat(),
                    "FechaVencimiento": factura.fecha_vencimiento.isoformat(),
                    "FormaPago": 2,  # crédito (se paga después de emitida)
                },
                "Emisor": _construir_emisor(config),
                "Receptor": _construir_receptor(factura),
                "RutSolicitante": "",
                "Transporte": None,
                "Totales": totales,
            },
            "Detalles": [
                {
                    "IndicadorExento": 1 if es_exento else 0,
                    "Nombre": f"Consumo de agua potable - período {factura.periodo}",
                    "Descripcion": f"Consumo {factura.consumo_m3} m3",
                    "Cantidad": 1.0,
                    "UnidadMedida": "un",
                    "Precio": monto_item,
                    "Descuento": 0,
                    "Recargo": 0,
                    "MontoItem": monto_item,
                }
            ],
            "Referencias": [],
            "DescuentosRecargos": descuentos_recargos,
        },
        "Certificado": {
            "Rut": config.rut_empresa,
            "Password": password_certificado,
        },
    }


def enviar_documento_sii(db: Session, factura: Factura) -> dict:
    if not SIMPLEAPI_BASE_URL or not SIMPLEAPI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Falta configurar SimpleAPI (SIMPLEAPI_BASE_URL / SIMPLEAPI_API_KEY)",
        )

    if not factura.tipo_dte:
        raise HTTPException(
            status_code=400,
            detail="La factura no tiene tipo_dte asignado",
        )

    config = (
        db.query(Configuracion)
        .filter(Configuracion.empresa_id == factura.empresa_id)
        .first()
    )
    if config is None:
        raise HTTPException(status_code=400, detail="La empresa no tiene configuración cargada")

    if not config.certificado_pfx_path or not config.certificado_password:
        raise HTTPException(
            status_code=400,
            detail="La empresa no tiene certificado digital cargado. Sube el .pfx en Configuración.",
        )

    # Reserva el folio en memoria, sin confirmarlo aún en la BD.
    folio, caf = caf_service.reservar_folio(db, factura.empresa_id, factura.tipo_dte)

    certificado_pfx = descargar_archivo(BUCKET_CERTIFICADOS, config.certificado_pfx_path)
    caf_xml = descargar_archivo(BUCKET_CAF_SII, caf.archivo_xml)
    password_certificado = desencriptar(config.certificado_password)
    documento = _construir_documento(factura, config, folio, password_certificado)

    url = f"{SIMPLEAPI_BASE_URL}/api/v1/dte/generar"
    files = {
        "input": (None, json.dumps(documento), "application/json"),
        "files": ("certificado.pfx", certificado_pfx, "application/x-pkcs12"),
        "files2": ("caf.xml", caf_xml, "application/xml"),
    }
    headers = {"Authorization": SIMPLEAPI_API_KEY}

    try:
        respuesta = httpx.post(url, files=files, headers=headers, timeout=60.0)
    except httpx.RequestError as e:
        db.rollback()  # descarta la reserva del folio: no se llegó a enviar nada
        raise HTTPException(status_code=502, detail=f"No se pudo conectar con SimpleAPI: {e}")

    if respuesta.status_code != 200:
        db.rollback()  # SimpleAPI rechazó antes de tocar al SII: el folio no se usó, se libera
        factura.estado_envio_sii = "error"
        db.commit()
        raise HTTPException(
            status_code=502,
            detail=f"SimpleAPI rechazó el envío ({respuesta.status_code}): {respuesta.text}",
        )

    # Éxito: recién aquí se confirma el folio junto con el estado de la factura
    resultado = respuesta.json()
    factura.folio_sii = str(folio)
    factura.estado_envio_sii = "enviado"
    db.commit()

    return resultado