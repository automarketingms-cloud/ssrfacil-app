import { useState, useEffect } from "react";
import {
  obtenerReporteClientesSubsidio,
  descargarReporteClientesSubsidioExcel,
} from "../api/reportes";
import type { ClienteSubsidio } from "../types";

export default function ReporteClientesSubsidio() {
  const [soloActivos, setSoloActivos] = useState(true);
  const [clientes, setClientes] = useState<ClienteSubsidio[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const buscar = async () => {
    setError("");
    setCargando(true);
    try {
      const data = await obtenerReporteClientesSubsidio(soloActivos);
      setClientes(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al obtener el reporte",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    buscar();
  }, [soloActivos]);

  const manejarDescarga = async () => {
    try {
      await descargarReporteClientesSubsidioExcel(soloActivos);
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
          Clientes con Subsidio — Reporte
        </h1>
        <p className="text-sm text-muted mb-4">
          Reporte interno de clientes con subsidio activo y su porcentaje de
          descuento.
        </p>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
            />
            Solo clientes activos
          </label>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {clientes && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-text">
              Detalle ({clientes.length})
            </h3>
            <button
              onClick={manejarDescarga}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-text px-3 py-1.5 rounded-lg"
            >
              Descargar Excel
            </button>
          </div>

          {cargando ? (
            <p className="text-sm text-muted">Cargando...</p>
          ) : clientes.length === 0 ? (
            <p className="text-sm text-muted">No hay clientes con subsidio.</p>
          ) : (
            <TablaClientesSubsidio clientes={clientes} />
          )}
        </div>
      )}
    </div>
  );
}

function TablaClientesSubsidio({ clientes }: { clientes: ClienteSubsidio[] }) {
  return (
    <div className="overflow-x-auto bg-surface border border-border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-primary-light/40 text-text text-left">
            <th className="px-4 py-2 font-medium">Nombre</th>
            <th className="px-4 py-2 font-medium">RUT</th>
            <th className="px-4 py-2 font-medium">N° Medidor</th>
            <th className="px-4 py-2 font-medium">Dirección</th>
            <th className="px-4 py-2 font-medium">Socio</th>
            <th className="px-4 py-2 font-medium">% Subsidio</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-4 py-2">{c.nombre}</td>
              <td className="px-4 py-2">{c.rut}</td>
              <td className="px-4 py-2">{c.numero_medidor}</td>
              <td className="px-4 py-2">{c.direccion ?? "—"}</td>
              <td className="px-4 py-2">{c.es_socio ? "Sí" : "No"}</td>
              <td className="px-4 py-2">
                {(c.porcentaje_subsidio * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
