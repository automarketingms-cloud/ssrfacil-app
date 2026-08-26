import { useState } from "react";
import Input from "../components/Input";
import { cambiarMiPassword } from "../api/usuarios";
import { useAuth } from "../context/AuthContext";

const ROL_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  oficina: "Oficina",
  terreno: "Terreno",
};

export default function MiPerfil() {
  const { usuario } = useAuth();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (passwordNueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (passwordNueva !== passwordConfirmacion) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await cambiarMiPassword(passwordActual, passwordNueva);
      setSuccess(true);
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmacion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-text mb-1">Mi Perfil</h1>
      <p className="text-sm text-muted mb-6">
        {usuario?.nombre} ·{" "}
        {usuario ? (ROL_LABELS[usuario.rol] ?? usuario.rol) : ""}
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
      >
        <p className="text-sm font-medium text-text">Cambiar contraseña</p>

        <Input
          label="Contraseña actual"
          name="password_actual"
          type="password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          required
        />
        <Input
          label="Nueva contraseña"
          name="password_nueva"
          type="password"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
          required
          placeholder="Mínimo 8 caracteres"
        />
        <Input
          label="Confirmar nueva contraseña"
          name="password_confirmacion"
          type="password"
          value={passwordConfirmacion}
          onChange={(e) => setPasswordConfirmacion(e.target.value)}
          required
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-primary-dark bg-primary-light border border-primary/20 rounded-lg px-3 py-2">
            Contraseña actualizada correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
