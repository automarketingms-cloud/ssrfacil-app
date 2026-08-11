import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarTarifas, eliminarTarifa } from "../api/tarifas";
import type { Tarifa } from "../types";
import { formatoCLP } from "../utils/formato";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ListarTarifas() {
  const navigate = useNavigate();
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [tarifaAEliminar, setTarifaAEliminar] = useState<Tarifa | null>(null);

  useEffect(() => {
    cargarTarifas();
  }, []);

  function cargarTarifas() {
    setLoading(true);
    listarTarifas()
      .then(setTarifas)
      .catch(() => setError("No se pudieron cargar las tarifas"))
      .finally(() => setLoading(false));
  }

  function toggleExpandir(id: number) {
    setExpandida((prev) => (prev === id ? null : id));
  }

  async function handleConfirmarEliminar() {
    if (!tarifaAEliminar) return;
    setEliminando(tarifaAEliminar.id);
    setError(null);
    try {
      await eliminarTarifa(tarifaAEliminar.id);
      setTarifaAEliminar(null);
      cargarTarifas();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la tarifa",
      );
      setTarifaAEliminar(null);
    } finally {
      setEliminando(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-text">Tarifas</h1>
        <button
          onClick={() => navigate("/tarifas/nueva")}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Nueva tarifa
        </button>
      </div>
      <p className="text-sm text-muted mb-6">
        Histórico de tarifas configuradas. La más reciente vigente a la fecha se
        aplica automáticamente en la facturación.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Cargando tarifas...</p>
      ) : tarifas.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay tarifas registradas.</p>
      ) : (
        <div className="space-y-3">
          {tarifas.map((t, index) => (
            <div
              key={t.id}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-light/20 transition-colors">
                <button
                  onClick={() => toggleExpandir(t.id)}
                  className="flex-1 text-left"
                >
                  <p className="text-sm font-medium text-text">{t.nombre}</p>
                  <p className="text-xs text-muted">
                    Vigente desde {t.vigente_desde} · Cargo fijo{" "}
                    {formatoCLP(t.cargo_fijo)}
                  </p>
                </button>

                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <button
                      onClick={() => setTarifaAEliminar(t)}
                      disabled={eliminando === t.id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {eliminando === t.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpandir(t.id)}
                    className="text-xs text-primary-dark font-medium"
                  >
                    {expandida === t.id ? "Ocultar tramos" : "Ver tramos"}
                  </button>
                </div>
              </div>

              {expandida === t.id && (
                <table className="w-full text-sm border-t border-border">
                  <thead className="bg-primary-light/40 text-text">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Tramo</th>
                      <th className="text-left px-4 py-2 font-medium">
                        Desde (m³)
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Hasta (m³)
                      </th>
                      <th className="text-left px-4 py-2 font-medium">
                        Precio por m³
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.tramos
                      .sort((a, b) => a.numero_tramo - b.numero_tramo)
                      .map((tramo) => (
                        <tr
                          key={tramo.numero_tramo}
                          className="border-t border-border"
                        >
                          <td className="px-4 py-2 text-text">
                            Tramo {tramo.numero_tramo}
                          </td>
                          <td className="px-4 py-2 text-muted">
                            {tramo.numero_tramo === 1 ? 0 : tramo.desde_m3}
                          </td>
                          <td className="px-4 py-2 text-muted">
                            {tramo.hasta_m3 ?? "En adelante"}
                          </td>
                          <td className="px-4 py-2 text-muted">
                            {formatoCLP(tramo.precio_m3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {tarifaAEliminar && (
        <ConfirmDialog
          title="¿Eliminar esta tarifa?"
          description={`Vas a eliminar ${tarifaAEliminar.nombre} (vigente desde ${tarifaAEliminar.vigente_desde}). Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          loading={eliminando !== null}
          danger
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setTarifaAEliminar(null)}
        />
      )}
    </div>
  );
}
