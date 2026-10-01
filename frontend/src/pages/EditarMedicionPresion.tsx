import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obtenerMedicionPresion,
  editarMedicionPresion,
  obtenerHistorialEdicionesMedicion,
} from "../api/presion";
import { listarReclamos } from "../api/reclamos";
import type {
  HistorialEdicion,
  MedicionPresion,
  MedicionPresionUpdate,
  Reclamo,
} from "../types";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import BotonVolver from "../components/BotonVolver";
import { useAuth } from "../context/AuthContext";
import {
  formatearFecha,
  formatearFechaHora,
  hoyChileISO,
  periodoActualChile,
} from "../utils/fechas";
import { puedeEditarMedicion } from "../utils/presion";

const ETIQUETAS_CAMPO: Record<string, string> = {
  punto_medicion: "Punto de medición",
  ubicacion: "Ubicación",
  fecha_medicion: "Fecha",
  hora_medicion: "Hora",
  presion_mca: "Presión (mca)",
  observaciones: "Observaciones",
  reclamo: "Reclamo asociado",
};

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "(vacío)";
  return String(valor);
}

export default function EditarMedicionPresion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [medicion, setMedicion] = useState<MedicionPresion | null>(null);
  const [historial, setHistorial] = useState<HistorialEdicion[]>([]);
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState({
    punto_medicion: "",
    ubicacion: "",
    fecha_medicion: "",
    hora_medicion: "",
    presion_mca: "",
    observaciones: "",
  });
  const [reclamoId, setReclamoId] = useState<number | "">("");

  useEffect(() => {
    async function cargar() {
      try {
        const [m, ediciones] = await Promise.all([
          obtenerMedicionPresion(Number(id)),
          obtenerHistorialEdicionesMedicion(Number(id)),
        ]);
        setMedicion(m);
        setHistorial(ediciones);
        setForm({
          punto_medicion: m.punto_medicion,
          ubicacion: m.ubicacion ?? "",
          fecha_medicion: m.fecha_medicion,
          hora_medicion: m.hora_medicion ? m.hora_medicion.slice(0, 5) : "",
          presion_mca: String(m.presion_mca),
          observaciones: m.observaciones ?? "",
        });
        setReclamoId(m.reclamo_id ?? "");
      } catch {
        setError("No se pudo cargar la medición");
      } finally {
        setCargando(false);
      }

      // si falla la carga de reclamos no bloqueamos la edición
      try {
        setReclamos(await listarReclamos({ estado: "abierto" }));
      } catch {
        setReclamos([]);
      }
    }
    cargar();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicion) return;
    setError("");

    if (!form.punto_medicion.trim()) {
      setError("El punto de medición es obligatorio");
      return;
    }
    if (!form.fecha_medicion) {
      setError("La fecha de medición es obligatoria");
      return;
    }
    const presion = Number(form.presion_mca);
    if (!form.presion_mca || isNaN(presion) || presion <= 0) {
      setError("La presión debe ser mayor a 0");
      return;
    }

    // Solo se envía lo que cambió respecto a lo cargado
    const datos: MedicionPresionUpdate = {};

    if (form.punto_medicion.trim() !== medicion.punto_medicion) {
      datos.punto_medicion = form.punto_medicion.trim();
    }
    const ubicacion = form.ubicacion.trim() || null;
    if (ubicacion !== medicion.ubicacion) datos.ubicacion = ubicacion;

    if (form.fecha_medicion !== medicion.fecha_medicion) {
      datos.fecha_medicion = form.fecha_medicion;
    }
    // el input time maneja HH:MM; se compara sin segundos para no generar cambios falsos
    const horaOriginal = medicion.hora_medicion
      ? medicion.hora_medicion.slice(0, 5)
      : "";
    if (form.hora_medicion !== horaOriginal) {
      datos.hora_medicion = form.hora_medicion || null;
    }
    if (presion !== medicion.presion_mca) datos.presion_mca = presion;

    const observaciones = form.observaciones.trim() || null;
    if (observaciones !== medicion.observaciones) {
      datos.observaciones = observaciones;
    }

    const reclamoFinal = reclamoId === "" ? null : reclamoId;
    if (reclamoFinal !== medicion.reclamo_id) datos.reclamo_id = reclamoFinal;

    if (Object.keys(datos).length === 0) {
      navigate("/presion");
      return;
    }

    setEnviando(true);
    try {
      await editarMedicionPresion(medicion.id, datos);
      navigate("/presion", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al editar la medición",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <div className="p-6 text-muted">Cargando...</div>;
  if (!medicion)
    return (
      <div className="p-6 text-red-600">
        {error || "Medición no encontrada"}
      </div>
    );

  if (!puedeEditarMedicion(medicion, usuario)) {
    return (
      <div className="max-w-2xl">
        <BotonVolver fallback="/presion" />
        <div className="bg-surface border border-border rounded-xl p-6 text-sm text-muted">
          No puedes editar esta medición: es de un mes anterior o fue registrada
          por otro usuario.
        </div>
      </div>
    );
  }

  const esAdmin = usuario?.rol === "admin";
  const fechaMin = esAdmin ? undefined : `${periodoActualChile()}-01`;
  const fechaMax = hoyChileISO();

  // si el reclamo asociado ya no está abierto, igual se muestra para no perderlo
  const reclamoActualFueraDeLista =
    medicion.reclamo_id !== null &&
    !reclamos.some((r) => r.id === medicion.reclamo_id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <BotonVolver fallback="/presion" />
        <h1 className="text-xl font-semibold text-text mb-1">
          Editar medición de presión
        </h1>
        <p className="text-sm text-muted mb-4">
          Registrada el {formatearFecha(medicion.fecha_medicion)}
          {medicion.registrado_por_nombre
            ? ` por ${medicion.registrado_por_nombre}`
            : ""}
          .
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
          />

          <Input
            label="Ubicación"
            name="ubicacion"
            value={form.ubicacion}
            onChange={handleChange}
            placeholder="Opcional"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha de medición"
              name="fecha_medicion"
              type="date"
              value={form.fecha_medicion}
              onChange={handleChange}
              min={fechaMin}
              max={fechaMax}
              required
            />
            <Input
              label="Hora"
              name="hora_medicion"
              type="time"
              value={form.hora_medicion}
              onChange={handleChange}
            />
          </div>

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
              <option value="">Sin reclamo asociado</option>
              {reclamoActualFueraDeLista && (
                <option value={medicion.reclamo_id!}>
                  Reclamo asociado actual (ya no está abierto)
                </option>
              )}
              {reclamos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.folio} — {r.tipo_reclamo}
                  {r.nombre_reclamante ? ` — ${r.nombre_reclamante}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
            >
              {enviando ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/presion")}
              className="text-muted px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {historial.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-text mb-2">
            Historial de ediciones
          </h2>
          <ul className="space-y-3">
            {historial.map((h) => (
              <li key={h.id} className="text-sm">
                <p className="text-xs text-muted">
                  {h.usuario_nombre ?? "—"} · {formatearFechaHora(h.fecha)}
                </p>
                <ul className="mt-1 space-y-1">
                  {Object.entries(h.cambios).map(([campo, c]) => (
                    <li key={campo} className="text-text break-words">
                      <span className="font-medium">
                        {ETIQUETAS_CAMPO[campo] ?? campo}:
                      </span>{" "}
                      <span className="text-muted line-through">
                        {formatearValor(c.antes)}
                      </span>{" "}
                      → <span>{formatearValor(c.despues)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
