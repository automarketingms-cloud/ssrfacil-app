import { useState } from "react";
import {
  obtenerReporteReclamos,
  urlReporteReclamosExcel,
  urlReporteReclamosPdf,
} from "../api/reportes";
import type { ReporteReclamos as ReporteReclamosType } from "../types";

const mesActual = new Date().toISOString().slice(0, 7); // "2026-07"

const ETIQUETAS_ESTADO: Record<string, string> = {
  abierto: "Abierto",
  respondido: "Respondido",
  cerrado: "Cerrado",
  cerrado_sin_respuesta: "Cerrado sin respuesta",
};

export default function ReporteReclamos() {
  const [periodo, setPeriodo] = useState(mesActual);
  const [reporte, setReporte] = useState<ReporteReclamosType | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const buscar = async () => {
    setError("");
    setCargando(true);
    setReporte(null);
    try {
      const data = await obtenerReporteReclamos(periodo);
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
          Libro de Reclamos — Reporte
        </h1>
        <p className="text-sm text-muted mb-4">
          Reclamos recibidos, por periodo, con plazo de respuesta y estado, para
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
                  href={urlReporteReclamosExcel(reporte.periodo)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-text px-3 py-1.5 rounded-lg"
                >
                  Descargar Excel
                </a>

                <a
                  href={urlReporteReclamosPdf(reporte.periodo)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-text px-3 py-1.5 rounded-lg"
                >
                  Descargar PDF
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metrica label="Total reclamos" valor={reporte.total_reclamos} />
              <Metrica label="Respondidos" valor={reporte.total_respondidos} />
              <Metrica
                label="Fuera de plazo"
                valor={reporte.total_fuera_de_plazo}
                alerta={reporte.total_fuera_de_plazo > 0}
              />
              <Metrica
                label="Promedio días hábiles"
                valor={reporte.promedio_dias_habiles_respuesta ?? "—"}
              />
              {Object.entries(reporte.reclamos_por_tipo).map(
                ([tipo, cantidad]) => (
                  <Metrica key={tipo} label={tipo} valor={cantidad} />
                ),
              )}
            </div>
          </div>

          {/* Detalle */}
          <div>
            <h3 className="text-md font-semibold text-text mb-2">
              Detalle ({reporte.detalle.length})
            </h3>
            {reporte.detalle.length === 0 ? (
              <p className="text-sm text-muted">
                No hay reclamos en este periodo.
              </p>
            ) : (
              <TablaReclamos reclamos={reporte.detalle} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metrica({
  label,
  valor,
  alerta = false,
}: {
  label: string;
  valor: number | string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`bg-surface border rounded-lg p-3 ${alerta ? "border-danger/40" : "border-border"}`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`text-lg font-semibold ${alerta ? "text-danger" : "text-text"}`}
      >
        {valor}
      </p>
    </div>
  );
}

function TablaReclamos({
  reclamos,
}: {
  reclamos: ReporteReclamosType["detalle"];
}) {
  return (
    <div className="overflow-x-auto bg-surface border border-border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-primary-light/40 text-text text-left">
            <th className="px-4 py-2 font-medium">Folio</th>
            <th className="px-4 py-2 font-medium">Tipo</th>
            <th className="px-4 py-2 font-medium">Reclamante</th>
            <th className="px-4 py-2 font-medium">Fecha Recepción</th>
            <th className="px-4 py-2 font-medium">Plazo Vencimiento</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Días Hábiles Respuesta</th>
            <th className="px-4 py-2 font-medium">Fuera de Plazo</th>
          </tr>
        </thead>
        <tbody>
          {reclamos.map((r) => (
            <tr key={r.folio} className="border-t border-border">
              <td className="px-4 py-2">{r.folio}</td>
              <td className="px-4 py-2">{r.tipo_reclamo}</td>
              <td className="px-4 py-2">{r.nombre_reclamante ?? "—"}</td>
              <td className="px-4 py-2">{r.fecha_recepcion}</td>
              <td className="px-4 py-2">{r.plazo_vencimiento}</td>
              <td className="px-4 py-2">{ETIQUETAS_ESTADO[r.estado]}</td>
              <td className="px-4 py-2">{r.dias_habiles_respuesta ?? "—"}</td>
              <td className="px-4 py-2">
                {r.fuera_de_plazo === null ? (
                  "—"
                ) : r.fuera_de_plazo ? (
                  <span className="text-red-600 font-medium">Sí</span>
                ) : (
                  "No"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
