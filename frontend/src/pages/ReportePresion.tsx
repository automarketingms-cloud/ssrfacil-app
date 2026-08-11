import { useEffect, useState } from "react";
import type { MedicionPresion } from "../types";
import { obtenerHistorialPresion } from "../api/presion";
import {
  urlDescargaExcelPresion,
  urlDescargaPdfPresion,
} from "../api/reportes";

export default function ReportePresion() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mediciones, setMediciones] = useState<MedicionPresion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, [desde, hasta]);

  async function cargarHistorial() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerHistorialPresion(
        desde || undefined,
        hasta || undefined,
      );
      setMediciones(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el historial");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-text mb-1">
        Reporte de presión
      </h1>
      <p className="text-sm text-muted mb-6">
        Mediciones de presión de servicio y cumplimiento normativo, para
        presentar en caso de fiscalización.
      </p>

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <a
          href={urlDescargaExcelPresion(desde || undefined, hasta || undefined)}
          className="text-sm font-medium rounded-lg px-4 py-2 border border-border text-text hover:bg-primary-light/30 transition-colors"
        >
          Descargar Excel
        </a>

        <a
          href={urlDescargaPdfPresion(desde || undefined, hasta || undefined)}
          className="text-sm font-medium rounded-lg px-4 py-2 border border-border text-text hover:bg-primary-light/30 transition-colors"
        >
          Descargar PDF
        </a>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : mediciones.length === 0 ? (
        <p className="text-muted">No hay mediciones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-primary-light/40 text-text">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Punto</th>
                <th className="text-left px-4 py-2 font-medium">Ubicación</th>
                <th className="text-left px-4 py-2 font-medium">Fecha</th>
                <th className="text-right px-4 py-2 font-medium">
                  Presión (mca)
                </th>
                <th className="text-left px-4 py-2 font-medium">
                  Rango normativo
                </th>
                <th className="text-center px-4 py-2 font-medium">Cumple</th>
              </tr>
            </thead>
            <tbody>
              {mediciones.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-2 text-text">{m.punto_medicion}</td>
                  <td className="px-4 py-2 text-muted">{m.ubicacion ?? "—"}</td>
                  <td className="px-4 py-2 text-text">{m.fecha_medicion}</td>
                  <td className="px-4 py-2 text-right text-text">
                    {m.presion_mca}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {m.rango_minimo} - {m.rango_maximo} mca
                  </td>
                  <td className="px-4 py-2 text-center">
                    {m.cumple ? (
                      <span className="text-xs font-medium bg-success-soft text-success px-2 py-1 rounded-full">
                        Sí
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-danger-soft text-danger px-2 py-1 rounded-full">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
