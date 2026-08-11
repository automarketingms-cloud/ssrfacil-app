import { useState } from "react";
import {
  obtenerReporteFacturacion,
  urlDescargaExcel,
  urlDescargaPdf,
} from "../api/reportes";
import type { ReporteFacturacionResponse } from "../types";
import { formatoCLP } from "../utils/formato";

export default function ReporteFacturacion() {
  const [periodo, setPeriodo] = useState("");
  const [reporte, setReporte] = useState<ReporteFacturacionResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!periodo) return;

    setLoading(true);
    setError(null);
    setReporte(null);
    try {
      const data = await obtenerReporteFacturacion(periodo);
      setReporte(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text mb-1">
        Reporte de facturación con respaldo
      </h1>
      <p className="text-sm text-muted mb-6">
        Detalle de cobros por período, para presentar en caso de fiscalización.
      </p>

      <form onSubmit={handleBuscar} className="flex items-end gap-3 mb-6">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Período
          </label>
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            required
            className="px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {reporte && (
          <>
            <a
              href={urlDescargaExcel(periodo)}
              className="text-sm font-medium rounded-lg px-4 py-2 border border-border text-text hover:bg-primary-light/30 transition-colors"
            >
              Descargar Excel
            </a>

            <a
              href={urlDescargaPdf(periodo)}
              className="text-sm font-medium rounded-lg px-4 py-2 border border-border text-text hover:bg-primary-light/30 transition-colors"
            >
              Descargar PDF
            </a>
          </>
        )}
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {reporte && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {reporte.detalle.length === 0 ? (
            <p className="text-sm text-muted p-6">
              No hay lecturas registradas para ese período.
            </p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-primary-light/40 text-text">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">RUT</th>
                    <th className="text-left px-4 py-2 font-medium">Cliente</th>
                    <th className="text-left px-4 py-2 font-medium">
                      N° Medidor
                    </th>
                    <th className="text-right px-4 py-2 font-medium">
                      Consumo (m³)
                    </th>
                    <th className="text-right px-4 py-2 font-medium">
                      Subtotal
                    </th>
                    <th className="text-right px-4 py-2 font-medium">
                      Subsidio
                    </th>
                    <th className="text-right px-4 py-2 font-medium">
                      Saldo anterior
                    </th>
                    <th className="text-right px-4 py-2 font-medium">
                      Total a pagar
                    </th>
                    <th className="text-left px-4 py-2 font-medium">
                      Vencimiento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.detalle.map((r) => (
                    <tr key={r.cliente_id} className="border-t border-border">
                      <td className="px-4 py-2 text-text">{r.rut}</td>
                      <td className="px-4 py-2 text-text">
                        {r.nombre_cliente}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {r.numero_medidor}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {r.consumo_m3}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {formatoCLP(r.subtotal)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {r.subsidio_aplicado > 0
                          ? `-${formatoCLP(r.subsidio_aplicado)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {r.saldo_anterior > 0
                          ? formatoCLP(r.saldo_anterior)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-text">
                        {formatoCLP(r.total_a_pagar)}
                      </td>
                      <td className="px-4 py-2 text-text">
                        {r.corte_en_tramite
                          ? "Corte en Trámite"
                          : (r.fecha_vencimiento ?? "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center px-4 py-3 bg-primary-light/20 border-t border-border">
                <span className="text-sm font-medium text-text">
                  Total general ({reporte.cantidad_clientes_facturados}{" "}
                  clientes)
                </span>
                <span className="text-base font-semibold text-primary-dark">
                  {formatoCLP(reporte.total_recaudado)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
