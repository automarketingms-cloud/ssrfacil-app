import { useEffect, useState } from "react";
import {
  obtenerRutaLectura,
  urlRutaLecturaExcel,
  urlRutaLecturaPdf,
} from "../api/rutaLectura";
import type { RutaLectura as RutaLecturaType, EstadoLectura } from "../types";

const FILTROS: { value: EstadoLectura | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "leido", label: "Leídos" },
];

function Badge({ estado }: { estado: EstadoLectura }) {
  const esLeido = estado === "leido";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        esLeido
          ? "bg-success-soft text-success"
          : "bg-warning-soft text-warning"
      }`}
    >
      {esLeido ? "Leído" : "Pendiente"}
    </span>
  );
}

export default function RutaLectura() {
  const [ruta, setRuta] = useState<RutaLecturaType | null>(null);
  const [filtro, setFiltro] = useState<EstadoLectura | "todos">("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    obtenerRutaLectura(filtro === "todos" ? undefined : filtro)
      .then(setRuta)
      .catch(() => setError("No se pudo cargar la ruta de lectura"))
      .finally(() => setCargando(false));
  }, [filtro]);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Ruta de Lectura</h1>
          {ruta && (
            <p className="text-sm text-muted">
              Período {ruta.periodo} · {ruta.total_pendientes} pendientes ·{" "}
              {ruta.total_leidos} leídos
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={urlRutaLecturaExcel()}
            className="px-3 py-2 text-sm rounded border border-border bg-surface hover:bg-slate-50"
          >
            Descargar Excel
          </a>

          <a
            href={urlRutaLecturaPdf()}
            className="px-3 py-2 text-sm rounded border border-border bg-surface hover:bg-slate-50"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              filtro === f.value
                ? "bg-primary text-white"
                : "bg-surface border border-border text-muted hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-muted">Cargando ruta...</p>
      ) : !ruta || ruta.clientes.length === 0 ? (
        <p className="text-muted">
          No hay clientes para mostrar con este filtro.
        </p>
      ) : (
        <table className="w-full text-sm border border-border rounded overflow-hidden">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-3 py-2">N° Medidor</th>
              <th className="text-left px-3 py-2">Cliente</th>
              <th className="text-left px-3 py-2">Dirección</th>
              <th className="text-left px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ruta.clientes.map((c) => (
              <tr key={c.cliente_id} className="border-t border-border">
                <td className="px-3 py-2">{c.numero_medidor}</td>
                <td className="px-3 py-2">{c.nombre}</td>
                <td className="px-3 py-2">{c.direccion}</td>
                <td className="px-3 py-2">
                  <Badge estado={c.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
