import { useState } from "react";
import Input from "../components/input";
import { crearMedicionPresion } from "../api/presion";

const today = new Date().toISOString().split("T")[0];

const initialForm = {
  punto_medicion: "",
  ubicacion: "",
  fecha_medicion: today,
  presion_mca: "",
  observaciones: "",
};

export default function RegistrarPresion() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    const horaActual = new Date().toTimeString().slice(0, 8); // "HH:MM:SS"

    try {
      await crearMedicionPresion({
        punto_medicion: form.punto_medicion,
        ubicacion: form.ubicacion || undefined,
        fecha_medicion: form.fecha_medicion,
        hora_medicion: horaActual,
        presion_mca: Number(form.presion_mca),
        observaciones: form.observaciones || undefined,
      });
      setSuccess(true);
      setForm({ ...initialForm, punto_medicion: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold text-text mb-1">
        Registrar medición de presión
      </h2>
      <p className="text-sm text-muted mb-6">
        Registra la presión de servicio medida en un punto de la red.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
      >
        <Input
          label="Punto de medición"
          name="punto_medicion"
          value={form.punto_medicion}
          onChange={handleChange}
          required
          placeholder="Arranque Sector Norte"
        />

        <Input
          label="Ubicación"
          name="ubicacion"
          value={form.ubicacion}
          onChange={handleChange}
          placeholder="Calle Los Aromos 123"
        />

        <Input
          label="Fecha de medición"
          name="fecha_medicion"
          type="date"
          value={form.fecha_medicion}
          onChange={handleChange}
          required
        />

        <Input
          label="Presión (m.c.a.)"
          name="presion_mca"
          type="number"
          value={form.presion_mca}
          onChange={handleChange}
          required
          placeholder="35"
        />

        <Input
          label="Observaciones"
          name="observaciones"
          value={form.observaciones}
          onChange={handleChange}
          placeholder="Opcional"
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-primary-dark bg-primary-light border border-primary/20 rounded-lg px-3 py-2">
            Medición registrada correctamente.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Guardando..." : "Registrar medición"}
        </button>
      </form>
    </div>
  );
}
