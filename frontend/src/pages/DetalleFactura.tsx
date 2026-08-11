import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, AlertTriangle } from "lucide-react";
import { obtenerFactura, urlFacturaPdf } from "../api/facturas";
import type { Factura } from "../types";

function formatearMonto(valor: number): string {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-success-soft text-success",
  vencida: "bg-danger-soft text-danger",
  parcial: "bg-amber-100 text-amber-700",
};

export default function DetalleFactura() {
  const { id } = useParams<{ id: string }>();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    obtenerFactura(Number(id))
      .then(setFactura)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar factura",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <p className="text-sm text-muted p-4">Cargando factura...</p>;

  if (error || !factura) {
    return (
      <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2">
        {error ?? "Factura no encontrada"}
      </div>
    );
  }

  const f = factura;
  const subtotal =
    f.cargo_fijo +
    f.monto_variable +
    f.cargo_fondo_reposicion -
    f.subsidio_aplicado +
    f.iva;

  return (
    <div>
      <Link
        to="/facturas"
        className="flex items-center gap-1 text-sm text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} /> Volver a Facturación
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">
            Boleta N° {f.id} — {f.periodo}
          </h1>
          <p className="text-sm text-muted">
            {f.nombre_cliente ?? `Cliente #${f.cliente_id}`}
          </p>
        </div>

        <a
          href={urlFacturaPdf(f.id)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Download size={16} /> Descargar PDF
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Fecha de emisión</p>
          <p className="text-sm text-text">{f.fecha_emision}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Fecha de vencimiento</p>
          <p className="text-sm text-text">{f.fecha_vencimiento}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Detalle de consumo en m3 */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text mb-3">
            Detalle de consumo en m3
          </h2>
          <div className="text-sm text-muted flex flex-col gap-1 mb-3">
            <p>Lectura actual: {f.lectura_actual}</p>
            <p>Lectura anterior: {f.lectura_anterior}</p>
            <p className="text-text font-medium">
              Consumo calculado: {f.consumo_m3}
            </p>
          </div>
          {f.detalle_tramos && f.detalle_tramos.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-bg text-muted uppercase">
                <tr>
                  <th className="text-left px-2 py-1">Tramo</th>
                  <th className="text-right px-2 py-1">M3</th>
                  <th className="text-right px-2 py-1">Valor</th>
                  <th className="text-right px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {f.detalle_tramos.map((t) => (
                  <tr key={t.numero_tramo} className="border-t border-border">
                    <td className="px-2 py-1">{t.numero_tramo}</td>
                    <td className="px-2 py-1 text-right">{t.m3_en_tramo}</td>
                    <td className="px-2 py-1 text-right">
                      {formatearMonto(t.precio_m3)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {formatearMonto(t.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detalle de consumo en pesos */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text mb-3">
            Detalle de consumo en pesos
          </h2>
          <div className="text-sm flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Cargo fijo</span>
              <span className="text-text">{formatearMonto(f.cargo_fijo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Consumo (Cargo variable AP)</span>
              <span className="text-text">
                {formatearMonto(f.monto_variable)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cargo fondo de reposición</span>
              <span className="text-text">
                {formatearMonto(f.cargo_fondo_reposicion)}
              </span>
            </div>
            {f.subsidio_aplicado > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Subsidio aplicado</span>
                <span className="text-success">
                  -{formatearMonto(f.subsidio_aplicado)}
                </span>
              </div>
            )}
            {f.iva > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">IVA</span>
                <span className="text-text">{formatearMonto(f.iva)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
              <span className="text-text">Subtotal</span>
              <span className="text-text">{formatearMonto(subtotal)}</span>
            </div>
            {f.saldo_anterior > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Saldo anterior</span>
                <span className="text-danger">
                  {formatearMonto(f.saldo_anterior)}
                </span>
              </div>
            )}
            {f.interes_mora > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Interés por mora</span>
                <span className="text-danger">
                  {formatearMonto(f.interes_mora)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-primary text-white rounded-xl p-4 mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-80">Total a pagar</p>
          <p className="text-2xl font-semibold">
            {formatearMonto(f.total_a_pagar)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Vencimiento</p>
          <p className="text-sm font-medium">{f.fecha_vencimiento}</p>
          <span
            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[f.estado]}`}
          >
            {f.estado}
          </span>
        </div>
      </div>

      {f.mensaje_boleta && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Información</p>
              <p className="text-sm text-amber-700">{f.mensaje_boleta}</p>
              {f.fecha_limite_corte && (
                <p className="text-xs text-amber-700 mt-1">
                  Fecha límite antes de posible corte: {f.fecha_limite_corte}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
