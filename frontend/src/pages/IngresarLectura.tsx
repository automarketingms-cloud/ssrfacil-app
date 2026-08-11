import { useEffect, useState } from "react";
import Input from "../components/Input";
import ClienteCombobox from "../components/ClienteCombobox";
import { listarClientes } from "../api/clientes";
import { crearLectura, crearLecturaTerminoMedio } from "../api/lecturas";
import type { Cliente } from "../types";

const today = new Date().toISOString().split("T")[0];
const currentPeriodo = today.slice(0, 7); // "2026-07"

const initialForm = {
  cliente_id: "",
  fecha_lectura: today,
  periodo: currentPeriodo,
  lectura_actual: "",
};

export default function IngresarLectura() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingTerminoMedio, setLoadingTerminoMedio] = useState(false);

  useEffect(() => {
    listarClientes({ activo: true })
      .then(setClientes)
      .catch(() => setError("No se pudo cargar la lista de clientes"))
      .finally(() => setLoadingClientes(false));
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await crearLectura({
        cliente_id: Number(form.cliente_id),
        fecha_lectura: form.fecha_lectura,
        periodo: form.periodo,
        lectura_actual: Number(form.lectura_actual),
      });
      setSuccess(true);
      setForm({ ...initialForm, cliente_id: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleTerminoMedio() {
    if (!form.cliente_id || !form.periodo || !form.fecha_lectura) {
      setError(
        "Selecciona cliente, período y fecha antes de usar término medio",
      );
      return;
    }

    setLoadingTerminoMedio(true);
    setError(null);
    setSuccess(false);

    try {
      await crearLecturaTerminoMedio({
        cliente_id: Number(form.cliente_id),
        periodo: form.periodo,
        fecha_lectura: form.fecha_lectura,
      });
      setSuccess(true);
      setForm({ ...initialForm, cliente_id: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoadingTerminoMedio(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-text mb-1">Ingresar Lectura</h1>
      <p className="text-sm text-muted mb-6">
        Registra la lectura del medidor para el período correspondiente.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
      >
        <ClienteCombobox
          clientes={clientes}
          value={form.cliente_id}
          onChange={(clienteId) =>
            setForm((prev) => ({ ...prev, cliente_id: clienteId }))
          }
          loading={loadingClientes}
        />

        <Input
          label="Fecha de lectura"
          name="fecha_lectura"
          type="date"
          value={form.fecha_lectura}
          onChange={handleChange}
          required
        />

        <Input
          label="Período"
          name="periodo"
          value={form.periodo}
          onChange={handleChange}
          required
          placeholder="2026-07"
        />

        <Input
          label="Lectura actual (m³)"
          name="lectura_actual"
          type="number"
          value={form.lectura_actual}
          onChange={handleChange}
          required
          placeholder="1250"
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-primary-dark bg-primary-light border border-primary/20 rounded-lg px-3 py-2">
            Lectura registrada correctamente.
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading || loadingClientes || loadingTerminoMedio}
            className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {loading ? "Guardando..." : "Registrar lectura"}
          </button>

          <button
            type="button"
            onClick={handleTerminoMedio}
            disabled={loading || loadingClientes || loadingTerminoMedio}
            className="flex-1 border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-700 font-medium rounded-lg px-4 py-2 transition-colors"
            title="Usar cuando no se pudo leer el medidor: factura con el consumo promedio de los últimos 3 meses"
          >
            {loadingTerminoMedio
              ? "Calculando..."
              : "No se pudo leer / Término medio"}
          </button>
        </div>
      </form>
    </div>
  );
}
