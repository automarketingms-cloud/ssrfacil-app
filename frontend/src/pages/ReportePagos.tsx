import { useEffect, useState } from "react";
import {
  obtenerReportePagos,
  descargarReportePagosExcel,
} from "../api/reportes";
import { listarUsuarios } from "../api/usuarios";
import type { ReportePagos as ReportePagosType, Usuario } from "../types";

const hoy = new Date().toISOString().slice(0, 10); // "2026-09-06"

export default function ReportePagos() {
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [cajeroId, setCajeroId] = useState<string>("");
  const [cajeros, setCajeros] = useState<Usuario[]>([]);
  const [reporte, setReporte] = useState<ReportePagosType | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listarUsuarios()
      .then(setCajeros)
      .catch(() => setCajeros([]));
  }, []);

  const buscar = async () => {
    setError("");
    setCargando(true);
    setReporte(null);
    try {
      const data = await obtenerReportePagos(
        desde,
        hasta,
        cajeroId ? Number(cajeroId) : undefined,
      );
      setReporte(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al obtener el reporte",
      );
    } finally {
      setCargando(false);
    }
  };

  const manejarDescarga = async () => {
    try {
      await descargarReportePagosExcel(
        desde,
        hasta,
        cajeroId ? Number(cajeroId) : undefined,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al descargar el reporte",
      );
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text mb-1">
          Reporte de Pagos
        </h1>
        <p className="text-sm text-muted mb-4">
          Pagos registrados por fecha y, opcionalmente, por cajero.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
          <div>
            <label className="block text-sm text-muted mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Cajero</label>
            <select
              value={cajeroId}
              onChange={(e) => setCajeroId(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos</option>
              {cajeros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={buscar}
            disabled={cargando}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {cargando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {reporte && (
        <>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-text">
                Resumen — {reporte.desde} a {reporte.hasta}
              </h2>
              <button
                onClick={manejarDescarga}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-text px-3 py-1.5 rounded-lg"
              >
                Descargar Excel
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reporte.resumen_por_metodo.map((r) => (
                <Metrica
                  key={r.metodo_pago}
                  label={`${r.metodo_pago.replace("_", " ")} (${r.cantidad})`}
                  valor={`$${r.total.toLocaleString("es-CL")}`}
                />
              ))}
              <Metrica
                label="Total general"
                valor={`$${reporte.total_general.toLocaleString("es-CL")}`}
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-text mb-2">
              Detalle ({reporte.pagos.length})
            </h3>
            {reporte.pagos.length === 0 ? (
              <p className="text-sm text-muted">
                No hay pagos en este rango de fechas.
              </p>
            ) : (
              <TablaPagos pagos={reporte.pagos} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metrica({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <p className="text-xs text-muted capitalize">{label}</p>
      <p className="text-lg font-semibold text-text">{valor}</p>
    </div>
  );
}

function TablaPagos({ pagos }: { pagos: ReportePagosType["pagos"] }) {
  return (
    <div className="overflow-x-auto bg-surface border border-border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-primary-light/40 text-text text-left">
            <th className="px-4 py-2 font-medium">Fecha</th>
            <th className="px-4 py-2 font-medium">Cliente</th>
            <th className="px-4 py-2 font-medium">RUT</th>
            <th className="px-4 py-2 font-medium">Periodo</th>
            <th className="px-4 py-2 font-medium">Cajero</th>
            <th className="px-4 py-2 font-medium">Método</th>
            <th className="px-4 py-2 font-medium">Referencia</th>
            <th className="px-4 py-2 font-medium">Monto</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.pago_id} className="border-t border-border">
              <td className="px-4 py-2">{p.fecha_pago}</td>
              <td className="px-4 py-2">{p.cliente_nombre}</td>
              <td className="px-4 py-2">{p.cliente_rut}</td>
              <td className="px-4 py-2">{p.periodo}</td>
              <td className="px-4 py-2">{p.cajero_nombre}</td>
              <td className="px-4 py-2 capitalize">
                {p.metodo_pago.replace("_", " ")}
              </td>
              <td className="px-4 py-2">{p.referencia ?? "—"}</td>
              <td className="px-4 py-2">${p.monto.toLocaleString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
