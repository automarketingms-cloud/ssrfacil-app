// pages/RegistrarCorte.tsx
import { useState, useEffect } from "react";
import { abrirCorte, cerrarCorte, listarCortes } from "../api/continuidad";
import type { CorteResponse } from "../api/continuidad";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Select from "../components/Select";
export default function RegistrarCorte() {
  const [cortesAbiertos, setCortesAbiertos] = useState<CorteResponse[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cerrandoId, setCerrandoId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fecha_hora_inicio: "",
    tipo: "no_programado" as "programado" | "no_programado",
    causa: "",
    sector_afectado: "",
    clientes_afectados: "",
    observaciones: "",
  });

  const cargarAbiertos = async () => {
    try {
      const data = await listarCortes({ solo_abiertos: true });
      setCortesAbiertos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los cortes abiertos",
      );
    }
  };

  useEffect(() => {
    cargarAbiertos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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
      await abrirCorte({
        fecha_hora_inicio: form.fecha_hora_inicio,
        tipo: form.tipo,
        causa: form.causa,
        sector_afectado: form.sector_afectado,
        clientes_afectados: form.clientes_afectados
          ? Number(form.clientes_afectados)
          : undefined,
        observaciones: form.observaciones || undefined,
      });
      setForm({
        fecha_hora_inicio: "",
        tipo: "no_programado",
        causa: "",
        sector_afectado: "",
        clientes_afectados: "",
        observaciones: "",
      });
      setSuccess(true);
      cargarAbiertos();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar el corte",
      );
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = async (corteId: number) => {
    setError("");
    setCerrandoId(corteId);
    try {
      await cerrarCorte(corteId, {
        fecha_hora_termino: new Date().toISOString(),
      });
      cargarAbiertos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar el corte");
    } finally {
      setCerrandoId(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-text mb-1">
          Registrar corte de continuidad
        </h1>
        <p className="text-sm text-muted mb-6">
          Registra el inicio de un corte de agua potable. Luego podrás cerrarlo
          cuando se reponga el servicio.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
        >
          <Input
            label="Fecha y hora de inicio"
            name="fecha_hora_inicio"
            type="datetime-local"
            value={form.fecha_hora_inicio}
            onChange={handleChange}
            required
          />

          <Select
            label="Tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            options={[
              { value: "no_programado", label: "No programado" },
              { value: "programado", label: "Programado" },
            ]}
          />

          <Input
            label="Causa"
            name="causa"
            value={form.causa}
            onChange={handleChange}
            required
            placeholder="Rotura de matriz, falla eléctrica, etc."
          />

          <Input
            label="Sector afectado"
            name="sector_afectado"
            value={form.sector_afectado}
            onChange={handleChange}
            required
            placeholder="Sector Norte"
          />

          <Input
            label="Clientes afectados"
            name="clientes_afectados"
            type="number"
            value={form.clientes_afectados}
            onChange={handleChange}
            placeholder="Opcional"
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
              Corte registrado correctamente.
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {cargando ? "Guardando..." : "Registrar corte"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text mb-3">
          Cortes abiertos
        </h2>
        {cortesAbiertos.length === 0 ? (
          <p className="text-muted text-sm">
            No hay cortes abiertos actualmente.
          </p>
        ) : (
          <ul className="space-y-3">
            {cortesAbiertos.map((corte) => (
              <li
                key={corte.id}
                className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="text-text font-medium">
                    {corte.sector_afectado}
                  </p>
                  <p className="text-sm text-muted">
                    {corte.causa} — desde{" "}
                    {new Date(corte.fecha_hora_inicio).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCerrar(corte.id)}
                  disabled={cerrandoId === corte.id}
                  className="bg-gray-100 text-text px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                >
                  {cerrandoId === corte.id
                    ? "Cerrando..."
                    : "Cerrar (reponer ahora)"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
