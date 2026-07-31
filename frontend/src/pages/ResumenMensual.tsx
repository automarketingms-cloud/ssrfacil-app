import { useState } from "react";
import { obtenerResumenMensual } from "../api/consumos";
import type { ConsumoResponse } from "../types";

export default function ResumenMensual() {
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState<ConsumoResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!periodo) return;

    setLoading(true);
    setError(null);
    setResumen(null);
    try {
      const data = await obtenerResumenMensual(periodo);
      setResumen(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const totalGeneral =
    resumen?.reduce((acc, c) => acc + c.total_a_pagar, 0) ?? 0;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-1">Resumen mensual</h2>
      <p className="text-sm text-muted mb-6">
        Consumo y total a pagar de todos los clientes en un período.
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
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {resumen && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {resumen.length === 0 ? (
            <p className="text-sm text-muted p-6">
              No hay lecturas registradas para ese período.
            </p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-primary-light/40 text-text">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Cliente</th>
                    <th className="text-left px-4 py-2 font-medium">Socio</th>
                    <th className="text-right px-4 py-2 font-medium">
                      Consumo (m³)
                    </th>
                    <th className="text-right px-4 py-2 font-medium">
                      Subsidio
                    </th>
                    <th className="text-right px-4 py-2 font-medium">IVA</th>
                    <th className="text-right px-4 py-2 font-medium">
                      Total a pagar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.map((c) => (
                    <tr key={c.cliente_id} className="border-t border-border">
                      <td className="px-4 py-2 text-text">
                        {c.nombre_cliente}
                      </td>
                      <td className="px-4 py-2">
                        {c.es_socio ? (
                          <span className="text-xs font-medium bg-primary-light text-primary-dark px-2 py-1 rounded-full">
                            Socio
                          </span>
                        ) : (
                          <span className="text-xs text-muted">No socio</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {c.consumo_m3}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {c.subsidio_aplicado > 0
                          ? `-$${c.subsidio_aplicado.toLocaleString("es-CL")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-muted">
                        {c.iva_aplicado > 0
                          ? `$${c.iva_aplicado.toLocaleString("es-CL")}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-text">
                        ${c.total_a_pagar.toLocaleString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center px-4 py-3 bg-primary-light/20 border-t border-border">
                <span className="text-sm font-medium text-text">
                  Total general ({resumen.length} clientes)
                </span>
                <span className="text-base font-semibold text-primary-dark">
                  ${totalGeneral.toLocaleString("es-CL")}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
