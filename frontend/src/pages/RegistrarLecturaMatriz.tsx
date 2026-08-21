import { useEffect, useState } from "react";
import { crearLecturaMatriz } from "../api/lecturaMatriz";
import { obtenerConfiguracion } from "../api/configuracion";

function periodoActual(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}`;
}

const initialForm = {
  periodo: periodoActual(),
  fecha_lectura: new Date().toISOString().slice(0, 10),
  lectura_actual: 0,
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
    valor: string | number,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (!foto) {
      setError(
        "Debes tomar una foto del medidor matriz para guardar la lectura",
      );
      return;
    }

    try {
      setGuardando(true);
      await crearLecturaMatriz({ ...form, foto });
      setExito(true);
      setForm({ ...initialForm, periodo: periodoActual() });
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
      setFoto(null);
      setFotoPreview(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar la lectura",
      );
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
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.lectura_actual}
              onChange={(e) =>
                handleChange("lectura_actual", Number(e.target.value))
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
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFotoChange}
              className="block w-full text-sm text-text file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary-dark file:font-medium hover:file:bg-primary-light/70"
            />
            {fotoPreview && (
              <img
                src={fotoPreview}
                alt="Vista previa de la foto del medidor matriz"
                className="mt-3 w-40 h-40 object-cover rounded-lg border border-border"
              />
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
          className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar lectura"}
        </button>
      </form>
    </div>
  );
}
