import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/http";
import OlvidastePassword from "../components/OlvidastePassword";
import PieDerechos from "../components/PieDerechos";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Email o contraseña incorrectos");
      } else {
        setError("Error al iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm"
      >
        <img
          src="/logoLogin.png"
          alt="SSR Fácil"
          className="h-18 w-auto max-w-full mx-auto mb-6"
        />

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-md p-3 mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-primary text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

        <OlvidastePassword />
      </form>

      <PieDerechos className="text-white/70" />
    </div>
  );
}
