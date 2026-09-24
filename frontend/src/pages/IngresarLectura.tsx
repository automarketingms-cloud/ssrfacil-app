import { useEffect, useRef, useState } from "react";
import Input from "../components/Input";
import ClienteCombobox from "../components/ClienteCombobox";
import ConfirmDialog from "../components/ConfirmDialog";
import { listarClientes } from "../api/clientes";
import { crearLectura, crearLecturaTerminoMedio } from "../api/lecturas";
import type { Cliente } from "../types";

const today = new Date().toLocaleDateString("sv-SE");
const currentPeriodo = today.slice(0, 7); // "2026-07"

const initialForm = {
  cliente_id: "",
  fecha_lectura: today,
  periodo: currentPeriodo,
  lectura_actual: "",
};

type TipoConfirmacion = "lectura" | "termino_medio" | null;

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
  const [confirmacion, setConfirmacion] = useState<TipoConfirmacion>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const clienteSeleccionado = clientes.find(
    (c) => String(c.id) === form.cliente_id,
  );

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

  function quitarFoto() {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  }

  function limpiarFormulario() {
    setForm({ ...initialForm, cliente_id: "" });
    quitarFoto();
  }

  // --- Paso 1: validar y abrir el diálogo ---

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.cliente_id) {
      setError("Selecciona un cliente");
      return;
    }

    if (!foto) {
      setError("Debes tomar una foto del medidor para registrar la lectura");
      return;
    }

    setConfirmacion("lectura");
  }

  function handleTerminoMedio() {
    setError(null);
    setSuccess(false);

    if (!form.cliente_id || !form.periodo || !form.fecha_lectura) {
      setError(
        "Selecciona cliente, período y fecha antes de usar término medio",
      );
      return;
    }

    if (form.lectura_actual !== "" || foto) {
      setError(
        'Ingresaste una lectura o una foto. Si pudiste leer el medidor, usa "Registrar lectura". ' +
          "Si realmente no se pudo leer, borra la lectura y la foto antes de usar término medio.",
      );
      return;
    }

    setConfirmacion("termino_medio");
  }

  // --- Paso 2: guardar al confirmar ---

  async function confirmarLectura() {
    if (!foto) return;

    setLoading(true);
    setError(null);

    try {
      await crearLectura({
        cliente_id: Number(form.cliente_id),
        fecha_lectura: form.fecha_lectura,
        periodo: form.periodo,
        lectura_actual: Number(form.lectura_actual),
        foto,
      });
      setSuccess(true);
      setConfirmacion(null);
      limpiarFormulario();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setConfirmacion(null);
    } finally {
      setLoading(false);
    }
  }

  async function confirmarTerminoMedio() {
    setLoadingTerminoMedio(true);
    setError(null);

    try {
      await crearLecturaTerminoMedio({
        cliente_id: Number(form.cliente_id),
        periodo: form.periodo,
        fecha_lectura: form.fecha_lectura,
      });
      setSuccess(true);
      setConfirmacion(null);
      limpiarFormulario();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setConfirmacion(null);
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
          type="month"
          value={form.periodo}
          onChange={handleChange}
          required
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
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotoChange}
            className="block w-full text-sm text-text file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary-dark file:font-medium hover:file:bg-primary-light/70"
          />
          {fotoPreview && (
            <div className="mt-3 flex items-end gap-3">
              <img
                src={fotoPreview}
                alt="Vista previa de la foto del medidor"
                className="w-40 h-40 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={quitarFoto}
                className="text-sm text-red-600 hover:underline"
              >
                Quitar foto
              </button>
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
            Lectura registrada correctamente.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
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

      {confirmacion === "lectura" && (
        <ConfirmDialog
          title="¿Confirmas registrar esta lectura?"
          description="Revisa los datos antes de guardar. La lectura se usará para calcular el consumo y la factura del período."
          confirmLabel="Sí, registrar lectura"
          cancelLabel="Revisar de nuevo"
          loading={loading}
          error={error}
          onConfirm={confirmarLectura}
          onCancel={() => setConfirmacion(null)}
        >
          <div className="bg-bg border border-border rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Cliente</span>
              <span className="font-medium text-text text-right">
                {clienteSeleccionado?.nombre ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">N° medidor</span>
              <span className="font-medium text-text">
                {clienteSeleccionado?.numero_medidor ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Período</span>
              <span className="font-medium text-text">{form.periodo}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Fecha de lectura</span>
              <span className="font-medium text-text">
                {form.fecha_lectura}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <span className="text-muted">Lectura actual</span>
              <span className="font-semibold text-text">
                {form.lectura_actual} m³
              </span>
            </div>
            {fotoPreview && (
              <img
                src={fotoPreview}
                alt="Foto del medidor"
                className="w-24 h-24 object-cover rounded-lg border border-border"
              />
            )}
          </div>
        </ConfirmDialog>
      )}

      {confirmacion === "termino_medio" && (
        <ConfirmDialog
          title="¿Confirmas usar término medio?"
          description="No se registrará una lectura real. Se facturará el consumo promedio de los últimos meses con lectura real, y la diferencia se ajustará cuando vuelva a leerse el medidor."
          confirmLabel="Sí, usar término medio"
          cancelLabel="Cancelar"
          loading={loadingTerminoMedio}
          error={error}
          onConfirm={confirmarTerminoMedio}
          onCancel={() => setConfirmacion(null)}
        >
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Cliente</span>
              <span className="font-medium text-text text-right">
                {clienteSeleccionado?.nombre ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">N° medidor</span>
              <span className="font-medium text-text">
                {clienteSeleccionado?.numero_medidor ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Período</span>
              <span className="font-medium text-text">{form.periodo}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Fecha</span>
              <span className="font-medium text-text">
                {form.fecha_lectura}
              </span>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
