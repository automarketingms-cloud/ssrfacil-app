import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarClientes,
  desactivarCliente,
  reactivarCliente,
} from "../api/clientes";
import type { Cliente } from "../types";

type FiltroActivo = "todos" | "activos" | "inactivos";
type FiltroSocio = "todos" | "socios" | "no_socios";

const LIMIT = 500;

export default function ListarClientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>("activos");
  const [filtroSocio, setFiltroSocio] = useState<FiltroSocio>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  // debounce: espera 300ms sin escribir antes de disparar la búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaDebounced(busqueda);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  async function cargarClientes() {
    setLoading(true);
    setError(null);
    try {
      const filtros: {
        activo?: boolean;
        es_socio?: boolean;
        q?: string;
        limit?: number;
      } = { limit: LIMIT };
      if (filtroActivo === "activos") filtros.activo = true;
      if (filtroActivo === "inactivos") filtros.activo = false;
      if (filtroSocio === "socios") filtros.es_socio = true;
      if (filtroSocio === "no_socios") filtros.es_socio = false;
      if (busquedaDebounced.trim()) filtros.q = busquedaDebounced.trim();

      const data = await listarClientes(filtros);
      setClientes(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroActivo, filtroSocio, busquedaDebounced]);

  async function handleToggleActivo(cliente: Cliente) {
    try {
      if (cliente.activo) {
        await desactivarCliente(cliente.id);
      } else {
        await reactivarCliente(cliente.id);
      }
      cargarClientes();
    } catch {
      setError("No se pudo actualizar el estado del cliente");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-text">Clientes</h1>
        <button
          onClick={() => navigate("/clientes/nuevo")}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Nuevo cliente
        </button>
      </div>
      <p className="text-sm text-muted mb-6">
        Listado de clientes registrados en la APR.
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <select
          value={filtroActivo}
          onChange={(e) => setFiltroActivo(e.target.value as FiltroActivo)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>

        <select
          value={filtroSocio}
          onChange={(e) => setFiltroSocio(e.target.value as FiltroSocio)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="todos">Socios y no socios</option>
          <option value="socios">Solo socios</option>
          <option value="no_socios">Solo no socios</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted p-6">Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-muted p-6">
            No hay clientes que coincidan con el filtro.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-primary-light/40 text-text">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Nombre</th>
                <th className="text-left px-4 py-2 font-medium">RUT</th>
                <th className="text-left px-4 py-2 font-medium">Medidor</th>
                <th className="text-left px-4 py-2 font-medium">Socio</th>
                <th className="text-left px-4 py-2 font-medium">Estado</th>
                <th className="text-center px-4 py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2 text-text">{c.nombre}</td>
                  <td className="px-4 py-2 text-muted">{c.rut}</td>
                  <td className="px-4 py-2 text-muted">{c.numero_medidor}</td>
                  <td className="px-4 py-2">
                    {c.es_socio ? (
                      <span className="text-xs font-medium bg-primary-light text-primary-dark px-2 py-1 rounded-full">
                        Socio
                      </span>
                    ) : (
                      <span className="text-xs text-muted">No socio</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {c.activo ? (
                      <span className="text-xs font-medium bg-success-soft text-success px-2 py-1 rounded-full">
                        Activo
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-danger-soft text-danger px-2 py-1 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => navigate(`/clientes/${c.id}`)}
                        className="text-xs font-medium text-primary-dark hover:underline"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => navigate(`/clientes/${c.id}/editar`)}
                        className="text-xs font-medium text-primary-dark hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(c)}
                        className="text-xs font-medium text-primary-dark hover:underline"
                      >
                        {c.activo ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && total > 0 && (
        <p className="text-xs text-muted mt-3">
          {total} cliente{total !== 1 ? "s" : ""} en total
        </p>
      )}
    </div>
  );
}
