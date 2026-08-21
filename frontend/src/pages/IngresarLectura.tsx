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
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingTerminoMedio, setLoadingTerminoMedio] = useState(false);

  useEffect(() => {
    listarClientes({ activo: true, limit: 1000 })
      .then((data) => setClientes(data.items))
      .catch(() => setError("No se pudo cargar la lista de clientes"))
      .finally(() => setLoadingClientes(false));
  }, []);

  // Libera la URL del preview anterior al cambiar o desmontar, para no
  // acumular memoria (createObjectURL no se limpia solo).
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(archivo);
    setFotoPreview(archivo ? URL.createObjectURL(archivo) : null);
  }

  function limpiarFormulario() {
    setForm({ ...initialForm, cliente_id: "" });
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!foto) {
      setError("Debes tomar una foto del medidor para registrar la lectura");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await crearLectura({
        cliente_id: Number(form.cliente_id),
        fecha_lectura: form.fecha_lectura,
        periodo: form.periodo,
        lectura_actual: Number(form.lectura_actual),
        foto,
      });
      setSuccess(true);
      limpiarFormulario();
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
      limpiarFormulario();
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

        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Foto del medidor
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-muted mb-2">
            Obligatoria como respaldo de la lectura (no aplica para término
            medio).
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotoChange}
            className="block w-full text-sm text-text file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary-dark file:font-medium hover:file:bg-primary-light/70"
          />
          {fotoPreview && (
            <img
              src={fotoPreview}
              alt="Vista previa de la foto del medidor"
              className="mt-3 w-40 h-40 object-cover rounded-lg border border-border"
            />
          )}
        </div>

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
