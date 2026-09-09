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

TIPO_DTE_BOLETA = "39"


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
    return {
        "Rut": cliente.rut,
        "RazonSocial": cliente.nombre,
        "Direccion": cliente.direccion or "",
        "Comuna": "",  # boleta no exige comuna del receptor
        "Giro": "",    # boleta no exige giro del receptor
        "Contacto": "",
    }


def _construir_totales_y_recargos(factura: Factura) -> tuple[dict, list]:
    """
    Separa el consumo del período (neto + IVA) del arrastre de deuda anterior.
    Asunción: saldo_anterior + interes_mora van como recargo aparte, sin IVA
    adicional (la mora no genera IVA, y el saldo_anterior ya tributó IVA
    cuando se emitió su boleta original). Confirmar este criterio antes de
    ir a producción.
    """
    monto_neto = round(
        factura.cargo_fijo
        + factura.monto_variable
        + factura.cargo_fondo_reposicion
        - factura.subsidio_aplicado
    )
    recargo = round(factura.saldo_anterior + factura.interes_mora)

    totales = {
        "MontoNeto": monto_neto,
        "TasaIVA": 19,
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

    return {
        "Documento": {
            "Encabezado": {
                "IdentificacionDTE": {
                    "TipoDTE": int(TIPO_DTE_BOLETA),
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
                    "IndicadorExento": 0,
                    "Nombre": f"Consumo de agua potable - período {factura.periodo}",
                    "Descripcion": f"Consumo {factura.consumo_m3} m3",
                    "Cantidad": 1.0,
                    "UnidadMedida": "un",
                    "Precio": totales["MontoNeto"],
                    "Descuento": 0,
                    "Recargo": 0,
                    "MontoItem": totales["MontoNeto"],
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


def enviar_boleta_sii(db: Session, factura: Factura) -> dict:
    if not SIMPLEAPI_BASE_URL or not SIMPLEAPI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Falta configurar SimpleAPI (SIMPLEAPI_BASE_URL / SIMPLEAPI_API_KEY)",
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
    folio, caf = caf_service.reservar_folio(db, factura.empresa_id, TIPO_DTE_BOLETA)

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
    factura.tipo_dte = TIPO_DTE_BOLETA
    factura.estado_envio_sii = "enviado"
    db.commit()

    return resultado