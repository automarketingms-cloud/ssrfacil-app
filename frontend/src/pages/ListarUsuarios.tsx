import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarUsuarios, editarUsuario } from "../api/usuarios";
import { listarEmpresas } from "../api/empresas";
import { useAuth } from "../context/AuthContext";
import type { Usuario, Rol, Empresa } from "../types";

type FiltroActivo = "todos" | "activos" | "inactivos";

const ETIQUETAS_ROL: Record<Rol, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  oficina: "Oficina",
  terreno: "Terreno",
};

export default function ListarUsuarios() {
  const navigate = useNavigate();
  const { usuario: usuarioActual } = useAuth();
  const esSuperAdmin = usuarioActual?.rol === "super_admin";
  const puedeGestionar =
    usuarioActual?.rol === "admin" || usuarioActual?.rol === "super_admin";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>("todos");
  const [empresaFiltro, setEmpresaFiltro] = useState<string>("");
  const [busqueda, setBusqueda] = useState("");

  async function cargarUsuarios() {
    setLoading(true);
    setError(null);
    try {
      const empresaId =
        esSuperAdmin && empresaFiltro !== ""
          ? Number(empresaFiltro)
          : undefined;
      const data = await listarUsuarios(empresaId);
      setUsuarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (esSuperAdmin) {
      listarEmpresas()
        .then(setEmpresas)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaFiltro]);

  // Búsqueda y filtro de estado se aplican en el frontend (listas pequeñas)
  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroActivo === "activos" && !u.activo) return false;
      if (filtroActivo === "inactivos" && u.activo) return false;
      if (
        termino &&
        !u.nombre.toLowerCase().includes(termino) &&
        !u.email.toLowerCase().includes(termino)
      ) {
        return false;
      }
      return true;
    });
  }, [usuarios, filtroActivo, busqueda]);

  const nombreEmpresa = (empresaId: number | null) =>
    empresas.find((e) => e.id === empresaId)?.nombre ?? "—";

  async function handleToggleActivo(u: Usuario) {
    try {
      await editarUsuario(u.id, { activo: !u.activo });
      cargarUsuarios();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el usuario",
      );
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
        <h1 className="text-xl font-semibold text-text">Usuarios</h1>
        {puedeGestionar && (
          <button
            onClick={() => navigate("/usuarios/nuevo")}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            + Nuevo usuario
          </button>
        )}
      </div>
      <p className="text-sm text-muted mb-6">Usuarios con acceso al sistema.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
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

        {esSuperAdmin && (
          <select
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted p-6">Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="text-sm text-muted p-6">
            No hay usuarios que coincidan con el filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary-light/40 text-text">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Nombre</th>
                  <th className="text-left px-4 py-2 font-medium">Email</th>
                  <th className="text-left px-4 py-2 font-medium">Rol</th>
                  {esSuperAdmin && (
                    <th className="text-left px-4 py-2 font-medium">Empresa</th>
                  )}
                  <th className="text-left px-4 py-2 font-medium">Estado</th>
                  {puedeGestionar && (
                    <th className="text-center px-4 py-2 font-medium">
                      Acción
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-2 text-text">{u.nombre}</td>
                    <td className="px-4 py-2 text-muted">{u.email}</td>
                    <td className="px-4 py-2 text-muted">
                      {ETIQUETAS_ROL[u.rol] ?? u.rol}
                    </td>
                    {esSuperAdmin && (
                      <td className="px-4 py-2 text-muted">
                        {nombreEmpresa(u.empresa_id)}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      {u.activo ? (
                        <span className="text-xs font-medium bg-success-soft text-success px-2 py-1 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs font-medium bg-danger-soft text-danger px-2 py-1 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </td>
                    {puedeGestionar && (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => navigate(`/usuarios/${u.id}/editar`)}
                            className="text-xs font-medium text-primary-dark hover:underline"
                          >
                            Editar
                          </button>
                          {u.id !== usuarioActual?.id && (
                            <button
                              onClick={() => handleToggleActivo(u)}
                              className="text-xs font-medium text-primary-dark hover:underline"
                            >
                              {u.activo ? "Desactivar" : "Activar"}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && usuariosFiltrados.length > 0 && (
        <p className="text-xs text-muted mt-3">
          {usuariosFiltrados.length} usuario
          {usuariosFiltrados.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
