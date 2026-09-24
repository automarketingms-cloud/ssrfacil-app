import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerUsuario, editarUsuario } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";
import type { Rol, UsuarioUpdateData } from "../types";
import BotonVolver from "../components/BotonVolver";

const ROLES_ADMIN_EDITA: { value: Rol; label: string }[] = [
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

const ROLES_SUPER_ADMIN_EDITA: { value: Rol; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Administrador" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-gray-100 disabled:text-muted";

export default function EditarUsuario() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario: usuarioActual } = useAuth();
  const esSuperAdmin = usuarioActual?.rol === "super_admin";
  const esMiUsuario = usuarioActual?.id === Number(id);
  const roles = esSuperAdmin ? ROLES_SUPER_ADMIN_EDITA : ROLES_ADMIN_EDITA;
  const puedeCambiarPassword = esSuperAdmin || usuarioActual?.rol === "admin";

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("terreno");
  const [activo, setActivo] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerUsuario(Number(id))
      .then((u) => {
        setNombre(u.nombre);
        setEmail(u.email);
        setRol(u.rol);
        setActivo(u.activo);
      })
      .catch(() => setNoEncontrado(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setGuardando(true);
    try {
      const payload: UsuarioUpdateData = { nombre, email };
      // Tu propio rol y estado no se tocan desde aquí, para no quitarte acceso
      if (!esMiUsuario) {
        payload.rol = rol;
        payload.activo = activo;
      }
      if (puedeCambiarPassword && password.length > 0) {
        payload.password = password;
      }
      await editarUsuario(Number(id), payload);
      navigate("/usuarios");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando usuario...</p>;
  }

  if (noEncontrado) {
    return (
      <div className="max-w-lg">
        <BotonVolver fallback="/usuarios" />
        <p className="text-sm text-muted">Usuario no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <BotonVolver fallback="/usuarios" />
      <h1 className="text-xl font-semibold text-text mb-1">Editar usuario</h1>
      <p className="text-sm text-muted mb-6">
        Modifica los datos del usuario y guarda los cambios.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-surface border border-border rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Rol
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            disabled={esMiUsuario}
            className={inputClass}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Estado
          </label>
          <select
            value={activo ? "activo" : "inactivo"}
            onChange={(e) => setActivo(e.target.value === "activo")}
            disabled={esMiUsuario}
            className={inputClass}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          {esMiUsuario && (
            <p className="text-xs text-muted mt-1">
              No puedes cambiar tu propio rol ni tu estado.
            </p>
          )}
        </div>

        {puedeCambiarPassword && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Dejar en blanco para no cambiar"
              className={inputClass}
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/usuarios")}
            className="flex-1 border border-border bg-white text-text text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 border border-primary bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
