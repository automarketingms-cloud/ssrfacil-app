// src/pages/GestionUsuarios.tsx
import { useState, useEffect, FormEvent } from "react";
import { listarUsuarios, crearUsuario, editarUsuario } from "../api/usuarios";
import { listarEmpresas } from "../api/empresas";
import { useAuth } from "../context/AuthContext";
import type { Usuario, Rol, Empresa } from "../types";
import { ApiError } from "../api/http";

const ROLES_ADMIN_CREA: { value: Rol; label: string }[] = [
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

const ROLES_SUPER_ADMIN_CREA: { value: Rol; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

const ROLES_EDICION: { value: Rol; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Administrador" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

export default function GestionUsuarios() {
  const { usuario: usuarioActual } = useAuth();
  const esSuperAdmin = usuarioActual?.rol === "super_admin";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>("");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("terreno");
  const [empresaIdNuevo, setEmpresaIdNuevo] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRol, setEditRol] = useState<Rol>("terreno");
  const [editActivo, setEditActivo] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editGuardando, setEditGuardando] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const empresaIdNum =
        esSuperAdmin && empresaFiltro !== ""
          ? Number(empresaFiltro)
          : undefined;
      const data = await listarUsuarios(empresaIdNum);
      setUsuarios(data);
    } catch {
      setError("No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
    if (esSuperAdmin) {
      listarEmpresas()
        .then(setEmpresas)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (esSuperAdmin) {
      cargarUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaFiltro]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setGuardando(true);

    try {
      await crearUsuario({
        nombre,
        email,
        password,
        rol,
        ...(esSuperAdmin
          ? { empresa_id: empresaIdNuevo ? Number(empresaIdNuevo) : null }
          : {}),
      });
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("terreno");
      setEmpresaIdNuevo("");
      setMostrarForm(false);
      await cargarUsuarios();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Error al crear el usuario");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(u: Usuario) {
    try {
      await editarUsuario(u.id, { activo: !u.activo });
      await cargarUsuarios();
    } catch {
      setError("No se pudo actualizar el usuario");
    }
  }

  function abrirEdicion(u: Usuario) {
    setEditandoId(u.id);
    setEditNombre(u.nombre);
    setEditEmail(u.email);
    setEditRol(u.rol);
    setEditActivo(u.activo);
    setEditPassword("");
    setEditError(null);
  }

  function cerrarEdicion() {
    setEditandoId(null);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (editandoId === null) return;
    setEditGuardando(true);

    try {
      const payload: Record<string, unknown> = {
        nombre: editNombre,
        email: editEmail,
        activo: editActivo,
        rol: editRol,
      };
      if (esSuperAdmin && editPassword.length > 0) {
        payload.password = editPassword;
      }
      await editarUsuario(editandoId, payload);
      setEditandoId(null);
      await cargarUsuarios();
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err.message);
      } else {
        setEditError("Error al editar el usuario");
      }
    } finally {
      setEditGuardando(false);
    }
  }

  if (cargando) return <div className="p-6">Cargando usuarios...</div>;

  const rolesParaCrear = esSuperAdmin
    ? ROLES_SUPER_ADMIN_CREA
    : ROLES_ADMIN_CREA;

  const rolesParaEditar = esSuperAdmin ? ROLES_EDICION : ROLES_ADMIN_CREA;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">Usuarios</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-primary text-white rounded-md px-4 py-2 font-medium hover:opacity-90"
        >
          {mostrarForm ? "Cancelar" : "Nuevo usuario"}
        </button>
      </div>

      {esSuperAdmin && (
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Filtrar por empresa
          </label>
          <select
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {mostrarForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          {formError && (
            <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as Rol)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {rolesParaCrear.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {esSuperAdmin && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <select
                  value={empresaIdNuevo}
                  onChange={(e) => setEmpresaIdNuevo(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecciona una empresa</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="bg-primary text-white rounded-md px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      )}

      {editandoId !== null && (
        <form
          onSubmit={handleEditSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-700">Editar usuario</p>
            <button
              type="button"
              onClick={cerrarEdicion}
              className="text-sm text-gray-500 hover:underline"
            >
              Cerrar
            </button>
          </div>

          {editError && (
            <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">
              {editError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={editActivo ? "activo" : "inactivo"}
                onChange={(e) => setEditActivo(e.target.value === "activo")}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={editRol}
                onChange={(e) => setEditRol(e.target.value as Rol)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                {rolesParaEditar.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {esSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={8}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={editGuardando}
            className="bg-primary text-white rounded-md px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {editGuardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.nombre}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.rol}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.activo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => abrirEdicion(u)}
                    className="text-sm text-primary hover:underline"
                  >
                    Editar
                  </button>
                  {u.id !== usuarioActual?.id && (
                    <button
                      onClick={() => toggleActivo(u)}
                      className="text-sm text-primary hover:underline"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
