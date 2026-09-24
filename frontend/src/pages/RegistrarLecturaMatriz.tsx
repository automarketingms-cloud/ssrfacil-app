import { useEffect, useRef, useState } from "react";
import { crearLecturaMatriz } from "../api/lecturaMatriz";
import { obtenerConfiguracion } from "../api/configuracion";
import { aNumeroOVacio } from "../utils/numero";
import ConfirmDialog from "../components/ConfirmDialog";

function periodoActual(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}`;
}

const initialForm = {
  periodo: periodoActual(),
  fecha_lectura: new Date().toLocaleDateString("sv-SE"),
  lectura_actual: undefined as number | undefined,
  observaciones: "",
};

export default function RegistrarLecturaMatriz() {
  const [numeroMedidor, setNumeroMedidor] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    obtenerConfiguracion().then((config) => {
      setNumeroMedidor(config.numero_medidor_matriz ?? null);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  function handleChange(
    campo: keyof typeof initialForm,
    valor: string | number | undefined,
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setExito(false);
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(archivo);
    setFotoPreview(archivo ? URL.createObjectURL(archivo) : null);
    setExito(false);
  }

  function quitarFoto() {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  }

  // --- Paso 1: validar y abrir el diálogo ---

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (form.lectura_actual === undefined) {
      setError("Ingresa la lectura actual del medidor matriz");
      return;
    }

    if (!foto) {
      setError(
        "Debes tomar una foto del medidor matriz para guardar la lectura",
      );
      return;
    }

    setMostrarConfirmacion(true);
  }

  // --- Paso 2: guardar al confirmar ---

  async function confirmarGuardado() {
    if (form.lectura_actual === undefined || !foto) return;

    setGuardando(true);
    setError(null);

    try {
      await crearLecturaMatriz({
        ...form,
        lectura_actual: form.lectura_actual,
        foto,
      });
      setExito(true);
      setMostrarConfirmacion(false);
      setForm({ ...initialForm, periodo: periodoActual() });
      quitarFoto();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar la lectura",
      );
      setMostrarConfirmacion(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-text mb-6">
        Registrar Lectura Medidor Matriz
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">N° Medidor</label>
            <input
              type="text"
              disabled
              className="w-full border border-border rounded-md px-3 py-2 bg-gray-100 text-muted"
              value={numeroMedidor ?? "No configurado"}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Período</label>
            <input
              type="month"
              required
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.periodo}
              onChange={(e) => handleChange("periodo", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Fecha de lectura
            </label>
            <input
              type="date"
              required
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.fecha_lectura}
              onChange={(e) => handleChange("fecha_lectura", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Lectura actual (m³)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.lectura_actual ?? ""}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                handleChange("lectura_actual", aNumeroOVacio(e.target.value))
              }
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Observaciones
            </label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Foto del medidor matriz
              <span className="text-red-500 ml-1">*</span>
            </label>
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
                  alt="Vista previa de la foto del medidor matriz"
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
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {exito && (
          <p className="text-sm text-green-600">
            Lectura registrada correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="border border-primary bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {guardando ? "Guardando..." : "Guardar lectura"}
        </button>
      </form>

      {mostrarConfirmacion && (
        <ConfirmDialog
          title="¿Confirmas registrar esta lectura?"
          description="Revisa los datos antes de guardar. Esta lectura se usará para controlar el consumo total del sistema en el período."
          confirmLabel="Sí, registrar lectura"
          cancelLabel="Revisar de nuevo"
          loading={guardando}
          error={error}
          onConfirm={confirmarGuardado}
          onCancel={() => setMostrarConfirmacion(false)}
        >
          <div className="bg-bg border border-border rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">N° medidor matriz</span>
              <span className="font-medium text-text">
                {numeroMedidor ?? "No configurado"}
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
            {form.observaciones && (
              <div className="flex justify-between gap-4">
                <span className="text-muted">Observaciones</span>
                <span className="font-medium text-text text-right">
                  {form.observaciones}
                </span>
              </div>
            )}
            {fotoPreview && (
              <img
                src={fotoPreview}
                alt="Foto del medidor matriz"
                className="w-24 h-24 object-cover rounded-lg border border-border"
              />
            )}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
