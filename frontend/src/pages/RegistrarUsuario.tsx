import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { crearUsuario } from "../api/usuarios";
import { listarEmpresas } from "../api/empresas";
import { useAuth } from "../context/AuthContext";
import type { Rol, Empresa } from "../types";
import BotonVolver from "../components/BotonVolver";

const ROLES_ADMIN_CREA: { value: Rol; label: string }[] = [
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

const ROLES_SUPER_ADMIN_CREA: { value: Rol; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "oficina", label: "Oficina" },
  { value: "terreno", label: "Terreno" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function RegistrarUsuario() {
  const navigate = useNavigate();
  const { usuario: usuarioActual } = useAuth();
  const esSuperAdmin = usuarioActual?.rol === "super_admin";
  const roles = esSuperAdmin ? ROLES_SUPER_ADMIN_CREA : ROLES_ADMIN_CREA;

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("terreno");
  const [empresaId, setEmpresaId] = useState<string>("");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (esSuperAdmin) {
      listarEmpresas()
        .then(setEmpresas)
        .catch(() => setError("No se pudieron cargar las empresas"));
    }
  }, [esSuperAdmin]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await crearUsuario({
        nombre,
        email,
        password,
        rol,
        ...(esSuperAdmin ? { empresa_id: Number(empresaId) } : {}),
      });
      navigate("/usuarios");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el usuario",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <BotonVolver fallback="/usuarios" />
      <h1 className="text-xl font-semibold text-text mb-1">Nuevo usuario</h1>
      <p className="text-sm text-muted mb-6">
        Crea un usuario con acceso al sistema.
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
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="text-xs text-muted mt-1">Mínimo 8 caracteres.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Rol
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            className={inputClass}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {esSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Empresa
            </label>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" disabled>
                Selecciona una empresa...
              </option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
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
            {guardando ? "Creando..." : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
