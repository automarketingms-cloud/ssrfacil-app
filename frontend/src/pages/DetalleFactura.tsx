import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, AlertTriangle, Send, Ban } from "lucide-react";
import {
  obtenerFactura,
  descargarFacturaPdf,
  enviarFacturaSii,
} from "../api/facturas";
import { anularFactura } from "../api/notasCredito";
import { useAuth } from "../context/AuthContext";
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
  anulada: "bg-gray-200 text-gray-600",
};

export default function DetalleFactura() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enviandoSii, setEnviandoSii] = useState(false);
  const [errorSii, setErrorSii] = useState<string | null>(null);

  const [mostrarModalAnular, setMostrarModalAnular] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    cargarFactura();
  }, [id]);

  function cargarFactura() {
    if (!id) return;
    setLoading(true);
    obtenerFactura(Number(id))
      .then(setFactura)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar factura",
        ),
      )
      .finally(() => setLoading(false));
  }

  async function handleEnviarSii() {
    if (!id) return;
    setErrorSii(null);
    try {
      setEnviandoSii(true);
      await enviarFacturaSii(Number(id));
      cargarFactura();
    } catch (err) {
      setErrorSii(
        err instanceof Error ? err.message : "Error al enviar al SII",
      );
    } finally {
      setEnviandoSii(false);
    }
  }

  async function handleAnular() {
    if (!id) return;
    if (!motivoAnulacion.trim()) {
      setErrorAnular("Debe indicar un motivo");
      return;
    }
    setErrorAnular(null);
    try {
      setAnulando(true);
      await anularFactura(Number(id), { motivo: motivoAnulacion.trim() });
      setMostrarModalAnular(false);
      setMotivoAnulacion("");
      cargarFactura();
    } catch (err) {
      setErrorAnular(
        err instanceof Error ? err.message : "Error al anular la factura",
      );
    } finally {
      setAnulando(false);
    }
  }

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

  const yaEnviada = f.estado_envio_sii === "enviado";
  const estaAnulada = f.estado === "anulada";
  const puedeAnular = usuario?.rol === "admin";

  return (
    <div>
      <Link
        to="/facturas"
        className="flex items-center gap-1 text-sm text-muted hover:text-text mb-4"
      >
        <ArrowLeft size={14} /> Volver a Facturación
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="text-xl font-semibold text-text">
            Boleta N° {f.id} — {f.periodo}
          </h1>
          <p className="text-sm text-muted">
            {f.nombre_cliente ?? `Cliente #${f.cliente_id}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEnviarSii}
            disabled={enviandoSii || yaEnviada || estaAnulada}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send size={16} />
            {yaEnviada
              ? `Enviada (folio ${f.folio_sii})`
              : enviandoSii
                ? "Enviando..."
                : "Enviar a SII"}
          </button>

          <button
            onClick={() => descargarFacturaPdf(f.id)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Download size={16} /> Descargar PDF
          </button>

          {puedeAnular && !estaAnulada && (
            <button
              onClick={() => setMostrarModalAnular(true)}
              className="flex items-center gap-2 bg-danger text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-colors cursor-pointer"
            >
              <Ban size={16} /> Anular factura
            </button>
          )}
        </div>
      </div>

      {errorSii && <p className="text-sm text-danger mb-4">{errorSii}</p>}

      {estaAnulada && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-4 flex items-start gap-2">
          <Ban size={16} className="text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Esta factura fue anulada
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Fecha de emisión</p>
          <p className="text-sm text-text">{f.fecha_emision}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Fecha de vencimiento</p>
          <p className="text-sm text-text">{f.fecha_vencimiento}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="overflow-x-auto">
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
            </div>
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

      <div className="bg-primary text-white rounded-xl p-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

      {mostrarModalAnular && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-text mb-2">
              Anular factura N° {f.id}
            </h2>
            <p className="text-sm text-muted mb-4">
              Esta acción genera una Nota de Crédito y no se puede deshacer. Si
              la factura tenía pagos, la devolución se gestiona fuera del
              sistema.
            </p>

            <label
              htmlFor="motivo_anulacion"
              className="text-sm font-medium text-text"
            >
              Motivo de anulación
            </label>
            <textarea
              id="motivo_anulacion"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ej: Error en el consumo registrado"
            />

            {errorAnular && (
              <p className="text-sm text-danger mt-2">{errorAnular}</p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setMostrarModalAnular(false);
                  setMotivoAnulacion("");
                  setErrorAnular(null);
                }}
                disabled={anulando}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text border border-border hover:bg-bg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAnular}
                disabled={anulando}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-danger hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {anulando ? "Anulando..." : "Confirmar anulación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
