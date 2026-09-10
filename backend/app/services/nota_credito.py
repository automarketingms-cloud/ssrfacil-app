from datetime import date
from sqlalchemy.orm import Session

from app.models.factura import Factura
from app.models.nota_credito import NotaCredito
from app.models.usuario import Usuario


def anular_factura(
    db: Session,
    factura_id: int,
    motivo: str,
    usuario: Usuario,
    empresa_id: int,
) -> NotaCredito:
    """
    Anula una factura por completo: crea el registro de Nota de Crédito
    (snapshot del tipo_dte y folio de la factura original) y cambia
    Factura.estado a "anulada". No revierte pagos ya registrados — si la
    factura tenía pagos, la devolución/reversa se maneja fuera del
    sistema; el pago queda como historial.
    """
    factura = (
        db.query(Factura)
        .filter(Factura.id == factura_id, Factura.empresa_id == empresa_id)
        .first()
    )
    if not factura:
        raise ValueError("Factura no encontrada")

    if factura.estado == "anulada":
        raise ValueError("Esta factura ya fue anulada")

    if not motivo or not motivo.strip():
        raise ValueError("Debe indicar un motivo de anulación")

    nota_credito = NotaCredito(
        empresa_id=empresa_id,
        factura_id=factura.id,
        motivo=motivo.strip(),
        fecha_emision=date.today(),
        anulado_por_id=usuario.id,
        tipo_dte_referencia=factura.tipo_dte,
        folio_referencia=factura.folio_sii,
    )
    factura.estado = "anulada"

    db.add(nota_credito)
    db.add(factura)
    db.commit()
    db.refresh(nota_credito)
    return nota_credito


def obtener_nota_credito(db: Session, nota_credito_id: int, empresa_id: int) -> NotaCredito:
    nota = (
        db.query(NotaCredito)
        .filter(NotaCredito.id == nota_credito_id, NotaCredito.empresa_id == empresa_id)
        .first()
    )
    if not nota:
        raise ValueError("Nota de crédito no encontrada")
    return nota


def listar_notas_credito(db: Session, empresa_id: int) -> list[NotaCredito]:
    return (
        db.query(NotaCredito)
        .filter(NotaCredito.empresa_id == empresa_id)
        .order_by(NotaCredito.fecha_emision.desc())
        .all()
    )


def serializar_nota_credito(nota: NotaCredito) -> dict:
    return {
        "id": nota.id,
        "empresa_id": nota.empresa_id,
        "factura_id": nota.factura_id,
        "motivo": nota.motivo,
        "fecha_emision": nota.fecha_emision,
        "anulado_por_id": nota.anulado_por_id,
        "tipo_dte": nota.tipo_dte,
        "tipo_dte_referencia": nota.tipo_dte_referencia,
        "folio_referencia": nota.folio_referencia,
        "folio_sii": nota.folio_sii,
        "estado_envio_sii": nota.estado_envio_sii,
        "creado_en": nota.creado_en,
    }