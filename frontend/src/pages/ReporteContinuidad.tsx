import { useState } from "react";
import {
  obtenerReporteContinuidad,
  urlReporteContinuidadExcel,
  urlReporteContinuidadPdf,
} from "../api/reportes";
import type { ReporteContinuidad as ReporteContinuidadType } from "../types";

const mesActual = new Date().toISOString().slice(0, 7); // "2026-07"

export default function ReporteContinuidad() {
  const [periodo, setPeriodo] = useState(mesActual);
  const [reporte, setReporte] = useState<ReporteContinuidadType | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const buscar = async () => {
    setError("");
    setCargando(true);
    setReporte(null);
    try {
      const data = await obtenerReporteContinuidad(periodo);
      setReporte(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al obtener el reporte",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text mb-1">
          Reporte de Continuidad de Servicio
        </h1>
        <p className="text-sm text-muted mb-4">
          Cortes de agua potable y su reposición, por periodo, para
          fiscalización SISS.
        </p>

        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm text-muted mb-1">Periodo</label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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
          {/* Resumen */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-text">
                Resumen — {reporte.periodo}
              </h2>
              <div className="flex gap-2">
                <a
                  href={urlReporteContinuidadExcel(reporte.periodo)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-text px-3 py-1.5 rounded-lg"
                >
                  Descargar Excel
                </a>

                <a
                  href={urlReporteContinuidadPdf(reporte.periodo)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-text px-3 py-1.5 rounded-lg"
                >
                  Descargar PDF
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metrica label="Total cortes" valor={reporte.total_cortes} />
              <Metrica label="Activos" valor={reporte.total_activos} />
              <Metrica label="Cerrados" valor={reporte.total_cerrados} />
              <Metrica
                label="Clientes afectados"
                valor={reporte.total_clientes_afectados}
              />
              <Metrica
                label="Duración total (hrs)"
                valor={reporte.duracion_total_horas}
              />
              <Metrica
                label="Duración promedio (hrs)"
                valor={reporte.duracion_promedio_horas}
              />
              {Object.entries(reporte.cortes_por_tipo).map(
                ([tipo, cantidad]) => (
                  <Metrica
                    key={tipo}
                    label={
                      tipo === "programado" ? "Programados" : "No programados"
                    }
                    valor={cantidad}
                  />
                ),
              )}
            </div>
          </div>

          {/* Cortes activos */}
          <div>
            <h3 className="text-md font-semibold text-text mb-2">
              Cortes activos ({reporte.cortes_activos.length})
            </h3>
            {reporte.cortes_activos.length === 0 ? (
              <p className="text-sm text-muted">
                No hay cortes activos en este periodo.
              </p>
            ) : (
              <TablaCortes cortes={reporte.cortes_activos} activo />
            )}
          </div>

          {/* Cortes cerrados */}
          <div>
            <h3 className="text-md font-semibold text-text mb-2">
              Cortes cerrados ({reporte.cortes_cerrados.length})
            </h3>
            {reporte.cortes_cerrados.length === 0 ? (
              <p className="text-sm text-muted">
                No hay cortes cerrados en este periodo.
              </p>
            ) : (
              <TablaCortes cortes={reporte.cortes_cerrados} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metrica({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold text-text">{valor}</p>
    </div>
  );
}

function TablaCortes({
  cortes,
  activo = false,
}: {
  cortes: ReporteContinuidadType["cortes_activos"];
  activo?: boolean;
}) {
  return (
    <div className="overflow-x-auto bg-surface border border-border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-primary-light/40 text-text text-left">
            <th className="px-4 py-2 font-medium">Inicio</th>
            {!activo && <th className="px-4 py-2 font-medium">Término</th>}
            {!activo && (
              <th className="px-4 py-2 font-medium">Duración (hrs)</th>
            )}
            <th className="px-4 py-2 font-medium">Tipo</th>
            <th className="px-4 py-2 font-medium">Causa</th>
            <th className="px-4 py-2 font-medium">Sector</th>
            <th className="px-4 py-2 font-medium">Clientes afectados</th>
          </tr>
        </thead>
        <tbody>
          {cortes.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-4 py-2">
                {new Date(c.fecha_hora_inicio).toLocaleString()}
              </td>
              {!activo && (
                <td className="px-4 py-2">
                  {c.fecha_hora_termino
                    ? new Date(c.fecha_hora_termino).toLocaleString()
                    : "—"}
                </td>
              )}
              {!activo && (
                <td className="px-4 py-2">{c.duracion_horas ?? "—"}</td>
              )}
              <td className="px-4 py-2">
                {c.tipo === "programado" ? "Programado" : "No programado"}
              </td>
              <td className="px-4 py-2">{c.causa}</td>
              <td className="px-4 py-2">{c.sector_afectado}</td>
              <td className="px-4 py-2">{c.clientes_afectados ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
