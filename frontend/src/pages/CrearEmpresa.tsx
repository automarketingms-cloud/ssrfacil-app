import { useState } from "react";
import Input from "../components/Input";
import { crearEmpresa } from "../api/empresas";
import { formatearRut, validarRut } from "../utils/rut";

const initialForm = {
  nombre: "",
  rut: "",
  admin_nombre: "",
  admin_email: "",
  admin_password: "",
};

export default function CrearEmpresa() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rutError, setRutError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formateado = formatearRut(e.target.value);
    setForm((prev) => ({ ...prev, rut: formateado }));

    if (formateado.length === 0) {
      setRutError(null);
    } else if (!validarRut(formateado)) {
      setRutError("RUT inválido");
    } else {
      setRutError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.rut.length > 0 && !validarRut(form.rut)) {
      setRutError("RUT inválido");
      return;
    }

    if (form.admin_password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await crearEmpresa({
        nombre: form.nombre,
        rut: form.rut || undefined,
        admin_nombre: form.admin_nombre,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
      });
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-text mb-1">Crear Empresa</h1>
      <p className="text-sm text-muted mb-6">
        Registra una nueva APR y su administrador inicial.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
      >
        <Input
          label="Nombre de la empresa"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          placeholder="APR Los Nogales"
        />
        <div>
          <Input
            label="RUT de la empresa"
            name="rut"
            value={form.rut}
            onChange={handleRutChange}
            placeholder="76.123.456-7"
            maxLength={12}
          />
          {rutError && <p className="text-xs text-red-600 mt-1">{rutError}</p>}
        </div>

        <div className="border-t border-border pt-4 flex flex-col gap-4">
          <p className="text-sm font-medium text-text">Administrador inicial</p>
          <Input
            label="Nombre completo"
            name="admin_nombre"
            value={form.admin_nombre}
            onChange={handleChange}
            required
            placeholder="Juan Pérez"
          />
          <Input
            label="Email"
            name="admin_email"
            type="email"
            value={form.admin_email}
            onChange={handleChange}
            required
            placeholder="juan@aprnogales.cl"
          />
          <Input
            label="Contraseña"
            name="admin_password"
            type="password"
            value={form.admin_password}
            onChange={handleChange}
            required
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-primary-dark bg-primary-light border border-primary/20 rounded-lg px-3 py-2">
            Empresa creada correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Guardando..." : "Crear empresa"}
        </button>
      </form>
    </div>
  );
}
