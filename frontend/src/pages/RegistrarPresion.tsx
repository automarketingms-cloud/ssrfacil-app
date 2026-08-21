import { useState, useEffect } from "react";
import { crearMedicionPresion, obtenerHistorialPresion } from "../api/presion";
import { listarReclamos } from "../api/reclamos";
import type { MedicionPresion, Reclamo } from "../types";
import Input from "../components/Input";
import Textarea from "../components/Textarea";

export default function RegistrarPresion() {
  const [historial, setHistorial] = useState<MedicionPresion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [asociarReclamo, setAsociarReclamo] = useState(false);
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [reclamoId, setReclamoId] = useState<number | "">("");

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

  const cargarReclamos = async () => {
    try {
      const data = await listarReclamos({ estado: "abierto" });
      setReclamos(data);
    } catch {
      // si falla la carga de reclamos no bloqueamos el registro de la medición
      setReclamos([]);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    if (asociarReclamo) {
      cargarReclamos();
    } else {
      setReclamoId("");
    }
  }, [asociarReclamo]);

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

    if (asociarReclamo && !reclamoId) {
      setError("Selecciona el reclamo asociado a esta medición");
      return;
    }

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
        reclamo_id: asociarReclamo ? Number(reclamoId) : undefined,
      });

      setForm({
        punto_medicion: "",
        ubicacion: "",
        fecha_medicion: "",
        presion_mca: "",
        observaciones: "",
      });
      setAsociarReclamo(false);
      setReclamoId("");
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

          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={asociarReclamo}
                onChange={(e) => setAsociarReclamo(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/40"
              />
              Esta medición responde a un reclamo
            </label>

            {asociarReclamo && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="reclamo_id"
                  className="text-sm font-medium text-text"
                >
                  Reclamo asociado
                </label>
                <select
                  id="reclamo_id"
                  value={reclamoId}
                  onChange={(e) =>
                    setReclamoId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Selecciona un reclamo...</option>
                  {reclamos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.folio} — {r.tipo_reclamo}
                      {r.nombre_reclamante ? ` — ${r.nombre_reclamante}` : ""}
                    </option>
                  ))}
                </select>
                {reclamos.length === 0 && (
                  <p className="text-xs text-muted">
                    No hay reclamos abiertos en este momento.
                  </p>
                )}
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
                    {m.reclamo_id ? " · Asociada a reclamo" : ""}
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
