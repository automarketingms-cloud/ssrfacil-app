import { useState, useEffect } from "react";
import { crearMedicionPresion, obtenerHistorialPresion } from "../api/presion";
import type { MedicionPresion } from "../types";
import Input from "../components/Input";
import Textarea from "../components/Textarea";

export default function RegistrarPresion() {
  const [historial, setHistorial] = useState<MedicionPresion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    punto_medicion: "",
    ubicacion: "",
    fecha_medicion: "",
    presion_mca: "",
    observaciones: "",
  });

  const cargarHistorial = async () => {
    try {
      const data = await obtenerHistorialPresion();
      setHistorial(data.slice(0, 10)); // últimas 10 mediciones
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial de mediciones",
      );
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setCargando(true);
    try {
      const horaActual = new Date().toTimeString().slice(0, 8); // "HH:MM:SS"

      await crearMedicionPresion({
        punto_medicion: form.punto_medicion,
        ubicacion: form.ubicacion || undefined,
        fecha_medicion: form.fecha_medicion,
        hora_medicion: horaActual,
        presion_mca: Number(form.presion_mca),
        observaciones: form.observaciones || undefined,
      });

      setForm({
        punto_medicion: "",
        ubicacion: "",
        fecha_medicion: "",
        presion_mca: "",
        observaciones: "",
      });
      setSuccess(true);
      cargarHistorial();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar la medición",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-text mb-1">
          Registrar medición de presión
        </h1>
        <p className="text-sm text-muted mb-6">
          Registra una medición de presión en un punto de la red. La hora se
          registra automáticamente al guardar.
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
            placeholder="Ej: Arranque red, Sector Norte"
          />

          <Input
            label="Ubicación"
            name="ubicacion"
            value={form.ubicacion}
            onChange={handleChange}
            placeholder="Opcional"
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
            label="Presión (mca)"
            name="presion_mca"
            type="number"
            step="0.1"
            value={form.presion_mca}
            onChange={handleChange}
            required
          />

          <Textarea
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            rows={3}
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
            disabled={cargando}
            className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {cargando ? "Guardando..." : "Registrar medición"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text mb-3">
          Últimas mediciones
        </h2>
        {historial.length === 0 ? (
          <p className="text-muted text-sm">
            No hay mediciones registradas todavía.
          </p>
        ) : (
          <ul className="space-y-3">
            {historial.map((m) => (
              <li
                key={m.id}
                className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-text font-medium">{m.punto_medicion}</p>
                  <p className="text-sm text-muted">
                    {m.fecha_medicion} {m.hora_medicion ?? ""} — {m.presion_mca}{" "}
                    mca
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    m.cumple
                      ? "bg-primary-light text-primary-dark"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {m.cumple ? "Dentro de rango" : "Fuera de rango"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
