import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  ClipboardCheck,
  FileText,
  Wallet,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import {
  obtenerDetalleCaja,
  obtenerPdfArqueo,
  editarMontoInicial,
} from "../api/cajas";
import { useAuth } from "../context/AuthContext";
import type { DetalleCaja } from "../types";
import BotonVolver from "../components/BotonVolver";

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
  const { usuario } = useAuth();
  const [detalle, setDetalle] = useState<DetalleCaja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  // Corrección del monto inicial
  const [mostrarModalMonto, setMostrarModalMonto] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardandoMonto, setGuardandoMonto] = useState(false);
  const [errorMonto, setErrorMonto] = useState<string | null>(null);

  async function cargarDetalle() {
    if (!id) return;
    try {
      const data = await obtenerDetalleCaja(Number(id));
      setDetalle(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el detalle",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function abrirModalMonto(montoActual: number) {
    setNuevoMonto(String(montoActual));
    setMotivo("");
    setErrorMonto(null);
    setMostrarModalMonto(true);
  }

  async function handleGuardarMonto() {
    if (!id) return;
    const monto = Number(nuevoMonto);
    if (nuevoMonto === "" || isNaN(monto) || monto < 0) {
      setErrorMonto("Ingresa un monto válido");
      return;
    }
    if (motivo.trim().length < 3) {
      setErrorMonto("Indica el motivo de la corrección");
      return;
    }
    setGuardandoMonto(true);
    setErrorMonto(null);
    try {
      await editarMontoInicial(Number(id), {
        monto_inicial: monto,
        motivo: motivo.trim(),
      });
      setMostrarModalMonto(false);
      await cargarDetalle();
    } catch (err) {
      setErrorMonto(
        err instanceof Error ? err.message : "Error al corregir el monto",
      );
    } finally {
      setGuardandoMonto(false);
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
      <div>
        <BotonVolver fallback="/caja" />
        <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2 max-w-md">
          {error ?? "Caja no encontrada"}
        </div>
      </div>
    );
  }

  const { caja, pagos, resumen_por_metodo, total_general } = detalle;

  // Mismas reglas que el backend: abierta -> cajero o admin; cerrada -> solo admin; arqueada -> nadie
  const esAdmin = usuario?.rol === "admin";
  const puedeCorregirMonto =
    !caja.fecha_arqueo &&
    (caja.estado === "abierta"
      ? esAdmin || caja.cajero_id === usuario?.id
      : esAdmin);
  const montoFueCorregido = caja.monto_inicial_original != null;

  return (
    <div>
      <BotonVolver fallback="/caja" />

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

      {/* Aviso de corrección del monto inicial */}
      {montoFueCorregido && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Monto inicial corregido</p>
            <p className="text-amber-700">
              Original: {formatearMonto(caja.monto_inicial_original!)} · Actual:{" "}
              {formatearMonto(caja.monto_inicial)}
            </p>
            <p className="text-amber-700">
              Por {caja.monto_inicial_editado_por_nombre ?? "—"}
              {caja.fecha_edicion_monto_inicial &&
                ` el ${formatearFechaHora(caja.fecha_edicion_monto_inicial)}`}
            </p>
            {caja.motivo_edicion_monto_inicial && (
              <p className="text-amber-700">
                Motivo: {caja.motivo_edicion_monto_inicial}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumen de montos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-muted">
              <Wallet size={14} />
              <p className="text-xs">Monto inicial</p>
            </div>
            {puedeCorregirMonto && (
              <button
                onClick={() => abrirModalMonto(caja.monto_inicial)}
                className="flex items-center gap-1 text-xs font-medium text-primary-dark hover:underline"
              >
                <Pencil size={12} /> Corregir
              </button>
            )}
          </div>
          <p className="text-lg font-semibold text-text">
            {formatearMonto(caja.monto_inicial)}
          </p>
          {montoFueCorregido && (
            <p className="text-xs text-amber-600 mt-0.5">Corregido</p>
          )}
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

      {/* Modal de corrección del monto inicial */}
      {mostrarModalMonto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-text mb-2">
              Corregir monto inicial
            </h2>
            <p className="text-sm text-muted mb-4">
              La corrección queda registrada con tu nombre, la fecha y el
              motivo, y se muestra en el detalle y en el PDF del arqueo.
              {caja.estado === "cerrada" &&
                " Como la caja ya está cerrada, se recalculará el efectivo esperado."}
            </p>

            <label
              htmlFor="nuevo_monto"
              className="text-sm font-medium text-text"
            >
              Monto inicial correcto
            </label>
            <input
              id="nuevo_monto"
              type="number"
              min={0}
              step={1}
              value={nuevoMonto}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setNuevoMonto(e.target.value)}
              className="mt-1 mb-3 w-full px-3 py-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            <label
              htmlFor="motivo_correccion"
              className="text-sm font-medium text-text"
            >
              Motivo
            </label>
            <textarea
              id="motivo_correccion"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={255}
              placeholder="Ej: Error al digitar el monto de apertura"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />

            {errorMonto && (
              <p className="text-sm text-danger mt-2">{errorMonto}</p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setMostrarModalMonto(false)}
                disabled={guardandoMonto}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text border border-border hover:bg-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarMonto}
                disabled={guardandoMonto}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {guardandoMonto ? "Guardando..." : "Guardar corrección"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
