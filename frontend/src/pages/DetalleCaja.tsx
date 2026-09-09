import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  ClipboardCheck,
  FileText,
  Wallet,
} from "lucide-react";
import { obtenerDetalleCaja, obtenerPdfArqueo } from "../api/cajas";
import type { DetalleCaja } from "../types";

function formatearMonto(valor: number): string {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLOR_METODO: Record<string, string> = {
  efectivo: "bg-success-soft text-success",
  tarjeta_debito: "bg-primary-light text-primary-dark",
  tarjeta_credito: "bg-primary-light text-primary-dark",
  transferencia: "bg-amber-100 text-amber-700",
};

export default function DetalleCaja() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState<DetalleCaja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerDetalleCaja(Number(id))
      .then(setDetalle)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar el detalle",
        ),
      )
      .finally(() => setCargando(false));
  }, [id]);

  async function handleDescargarPdf() {
    if (!id) return;
    setDescargando(true);
    try {
      const blob = await obtenerPdfArqueo(Number(id));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el PDF");
    } finally {
      setDescargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        Cargando...
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2 max-w-md">
        {error ?? "Caja no encontrada"}
      </div>
    );
  }

  const { caja, pagos, resumen_por_metodo, total_general } = detalle;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} /> Volver
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">
            Detalle de Caja #{caja.id}
          </h1>
          <p className="text-sm text-muted">
            Apertura: {formatearFechaHora(caja.fecha_apertura)}
            {caja.fecha_cierre && (
              <> · Cierre: {formatearFechaHora(caja.fecha_cierre)}</>
            )}
          </p>
        </div>

        <button
          onClick={handleDescargarPdf}
          disabled={descargando}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {descargando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Descargar PDF
        </button>
      </div>

      {/* Estado del arqueo */}
      {caja.fecha_arqueo && (
        <div className="bg-success-soft border border-success/30 rounded-xl p-4 mb-4 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-success" />
          <p className="text-sm text-success">
            Arqueada el {formatearFechaHora(caja.fecha_arqueo)}
            {caja.observaciones_arqueo && (
              <span className="text-muted"> · {caja.observaciones_arqueo}</span>
            )}
          </p>
        </div>
      )}

      {/* Resumen de montos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted mb-1">
            <Wallet size={14} />
            <p className="text-xs">Monto inicial</p>
          </div>
          <p className="text-lg font-semibold text-text">
            {formatearMonto(caja.monto_inicial)}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Efectivo esperado</p>
          <p className="text-lg font-semibold text-text">
            {formatearMonto(caja.monto_efectivo_esperado ?? 0)}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 sm:col-span-2 lg:col-span-2">
          <p className="text-xs text-muted mb-1">
            Total recaudado (todos los métodos)
          </p>
          <p className="text-lg font-semibold text-text">
            {formatearMonto(total_general)}
          </p>
        </div>
      </div>

      {/* Totales por método */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-text mb-3">
          Totales por método de pago
        </h2>
        {resumen_por_metodo.length === 0 ? (
          <p className="text-sm text-muted">
            Sin pagos registrados en este turno.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {resumen_por_metodo.map((r) => (
              <div
                key={r.metodo_pago}
                className="border border-border rounded-lg px-3 py-2"
              >
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${
                    COLOR_METODO[r.metodo_pago] ?? "bg-bg text-muted"
                  }`}
                >
                  {r.metodo_pago.replace("_", " ")}
                </span>
                <p className="text-sm text-muted">{r.cantidad} pago(s)</p>
                <p className="text-base font-semibold text-text">
                  {formatearMonto(r.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detalle de pagos */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-text mb-3">
          Pagos registrados
        </h2>
        {pagos.length === 0 ? (
          <p className="text-sm text-muted">
            Sin pagos registrados en este turno.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted uppercase border-b border-border">
                  <th className="py-2 pr-3">Hora</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Periodo</th>
                  <th className="py-2 pr-3">Método</th>
                  <th className="py-2 pr-3">Referencia</th>
                  <th className="py-2 pl-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr
                    key={p.pago_id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2 pr-3 text-muted">
                      {formatearHora(p.hora)}
                    </td>
                    <td className="py-2 pr-3">
                      <p className="text-text font-medium">
                        {p.cliente_nombre}
                      </p>
                      <p className="text-xs text-muted">{p.cliente_rut}</p>
                    </td>
                    <td className="py-2 pr-3 text-muted">{p.periodo}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          COLOR_METODO[p.metodo_pago] ?? "bg-bg text-muted"
                        }`}
                      >
                        {p.metodo_pago.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {p.referencia ?? "—"}
                    </td>
                    <td className="py-2 pl-3 text-right font-medium text-text">
                      {formatearMonto(p.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
