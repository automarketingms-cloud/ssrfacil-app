import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerCliente, actualizarCliente } from "../api/clientes";
import { formatearRut, validarRut } from "../utils/rut";
import type { Cliente } from "../types";

export default function EditarCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<Cliente>>({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rutError, setRutError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    obtenerCliente(Number(id))
      .then((cliente) => setForm(cliente))
      .catch(() => setError("No se pudo cargar el cliente"))
      .finally(() => setLoading(false));
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "porcentaje_subsidio"
            ? Number(value)
            : value,
    }));
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
    if (!id) return;

    if (form.rut && !validarRut(form.rut)) {
      setRutError("RUT inválido");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await actualizarCliente(Number(id), form);
      navigate("/clientes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando cliente...</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-text mb-1">Editar cliente</h1>
      <p className="text-sm text-muted mb-6">
        Modifica los datos del cliente y guarda los cambios.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre ?? ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            RUT
          </label>
          <input
            type="text"
            name="rut"
            value={form.rut ?? ""}
            onChange={handleRutChange}
            required
            maxLength={12}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {rutError && <p className="text-xs text-red-600 mt-1">{rutError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={form.direccion ?? ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Número de medidor
          </label>
          <input
            type="text"
            name="numero_medidor"
            value={form.numero_medidor ?? ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              name="es_socio"
              checked={form.es_socio ?? false}
              onChange={handleChange}
              className="rounded border-border"
            />
            Es socio
          </label>

          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              name="tiene_subsidio"
              checked={form.tiene_subsidio ?? false}
              onChange={handleChange}
              className="rounded border-border"
            />
            Tiene subsidio
          </label>
        </div>

        {form.tiene_subsidio && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Porcentaje de subsidio (ej: 0.5 = 50%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              name="porcentaje_subsidio"
              value={form.porcentaje_subsidio ?? 0}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
