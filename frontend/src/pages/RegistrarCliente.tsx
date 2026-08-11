import { useState } from "react";
import Input from "../components/Input";
import { crearCliente } from "../api/clientes";
import { formatearRut, validarRut } from "../utils/rut";

const initialForm = {
  nombre: "",
  rut: "",
  direccion: "",
  numero_medidor: "",
  es_socio: true,
  tiene_subsidio: false,
  porcentaje_subsidio: 0,
};

export default function RegistrarCliente() {
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

    if (!validarRut(form.rut)) {
      setRutError("RUT inválido");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await crearCliente({
        nombre: form.nombre,
        rut: form.rut,
        direccion: form.direccion,
        numero_medidor: form.numero_medidor,
        activo: true,
        es_socio: form.es_socio,
        tiene_subsidio: form.tiene_subsidio,
        porcentaje_subsidio: form.tiene_subsidio
          ? form.porcentaje_subsidio / 100
          : 0,
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
      <h1 className="text-xl font-semibold text-text mb-1">
        Registrar Cliente
      </h1>
      <p className="text-sm text-muted mb-6">
        Ingresa los datos del nuevo cliente de la APR.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
      >
        <Input
          label="Nombre completo"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          placeholder="Juan Pérez"
        />
        <div>
          <Input
            label="RUT"
            name="rut"
            value={form.rut}
            onChange={handleRutChange}
            required
            placeholder="12.345.678-9"
            maxLength={12}
          />
          {rutError && <p className="text-xs text-red-600 mt-1">{rutError}</p>}
        </div>
        <Input
          label="Dirección"
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
          required
          placeholder="Calle Los Aromos 123"
        />
        <Input
          label="Número de medidor"
          name="numero_medidor"
          value={form.numero_medidor}
          onChange={handleChange}
          required
          placeholder="M-00123"
        />

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={form.es_socio}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, es_socio: e.target.checked }))
            }
            className="rounded border-border text-primary focus:ring-primary/40"
          />
          Es socio de la APR
        </label>

        <div className="border-t border-border pt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={form.tiene_subsidio}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tiene_subsidio: e.target.checked,
                }))
              }
              className="rounded border-border text-primary focus:ring-primary/40"
            />
            Tiene subsidio
          </label>

          {form.tiene_subsidio && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="porcentaje_subsidio"
                className="text-sm font-medium text-text"
              >
                Porcentaje de subsidio (%)
              </label>
              <input
                id="porcentaje_subsidio"
                name="porcentaje_subsidio"
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.porcentaje_subsidio}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    porcentaje_subsidio: Number(e.target.value),
                  }))
                }
                className="px-3 py-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40 w-32"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-primary-dark bg-primary-light border border-primary/20 rounded-lg px-3 py-2">
            Cliente registrado correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Guardando..." : "Registrar cliente"}
        </button>
      </form>
    </div>
  );
}
