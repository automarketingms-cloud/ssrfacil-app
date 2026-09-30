import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerReclamo,
  responderReclamo,
  cerrarReclamo,
  cerrarReclamoSinRespuesta,
  obtenerHistorialReclamo,
} from "../api/reclamos";

import type { Reclamo, HistorialEdicion } from "../types";

import Textarea from "../components/Textarea";
import BotonVolver from "../components/BotonVolver";
import {
  formatearFecha,
  formatearFechaHora,
  hoyChileISO,
} from "../utils/fechas";

const ETIQUETAS_ESTADO: Record<string, string> = {
  abierto: "Abierto",
  respondido: "Respondido",
  cerrado: "Cerrado",
  cerrado_sin_respuesta: "Cerrado sin respuesta",
};

const ETIQUETAS_CAMPO: Record<string, string> = {
  cliente: "Cliente",
  nombre_reclamante: "Nombre reclamante",
  rut_reclamante: "RUT reclamante",
  direccion_reclamo: "Dirección",
  tipo_reclamo: "Tipo de reclamo",
  descripcion: "Descripción",
  observaciones: "Observaciones",
  respuesta: "Respuesta",
};

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "(vacío)";
  return String(valor);
}

export default function DetalleReclamo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reclamo, setReclamo] = useState<Reclamo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState<HistorialEdicion[]>([]);

  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [mostrarFormRespuesta, setMostrarFormRespuesta] = useState(false);

  const [motivoCierre, setMotivoCierre] = useState("");
  const [mostrarFormCierreDirecto, setMostrarFormCierreDirecto] =
    useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [datos, ediciones] = await Promise.all([
        obtenerReclamo(Number(id)),
        obtenerHistorialReclamo(Number(id)),
      ]);
      setReclamo(datos);
      setHistorial(ediciones);
    } catch {
      setError("No se pudo cargar el reclamo");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleResponder() {
    if (!respuestaTexto.trim()) {
      setError("La respuesta no puede estar vacía");
      return;
    }
    setError("");
    try {
      const actualizado = await responderReclamo(Number(id), respuestaTexto);
      setReclamo(actualizado);
      setMostrarFormRespuesta(false);
      setRespuestaTexto("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al responder");
    }
  }

  async function handleCerrar() {
    setError("");
    try {
      const actualizado = await cerrarReclamo(Number(id));
      setReclamo(actualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar");
    }
  }

  async function handleCerrarSinRespuesta() {
    if (!motivoCierre.trim()) {
      setError("Debes indicar el motivo del cierre");
      return;
    }
    setError("");
    try {
      const actualizado = await cerrarReclamoSinRespuesta(
        Number(id),
        motivoCierre,
      );
      setReclamo(actualizado);
      setMostrarFormCierreDirecto(false);
      setMotivoCierre("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cerrar el reclamo",
      );
    }
  }

  if (cargando) return <div className="p-6 text-muted">Cargando...</div>;
  if (!reclamo)
    return <div className="p-6 text-red-600">Reclamo no encontrado</div>;

  const fueraDePlazo =
    reclamo.estado === "abierto" && reclamo.plazo_vencimiento < hoyChileISO();

  const puedeEditar =
    reclamo.estado === "abierto" || reclamo.estado === "respondido";

  return (
    <div className="max-w-2xl">
      <BotonVolver fallback="/reclamos" />

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-text">
            Reclamo {reclamo.folio}
          </h1>
          <div className="flex items-center gap-3">
            {puedeEditar && (
              <button
                onClick={() => navigate(`/reclamos/${reclamo.id}/editar`)}
                className="bg-gray-100 hover:bg-gray-200 text-text text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
              >
                Editar
              </button>
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                {
                  abierto: "bg-warning-soft text-warning",
                  respondido: "bg-primary-light text-primary-dark",
                  cerrado: "bg-success-soft text-success",
                  cerrado_sin_respuesta: "bg-gray-100 text-muted",
                }[reclamo.estado]
              }`}
            >
              {ETIQUETAS_ESTADO[reclamo.estado]}
            </span>
          </div>
        </div>

        {fueraDePlazo && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
            Este reclamo está fuera del plazo normativo de respuesta (venció el{" "}
            {formatearFecha(reclamo.plazo_vencimiento)}).
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Reclamante</dt>
            <dd className="text-text">{reclamo.nombre_reclamante ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">RUT</dt>
            <dd className="text-text">{reclamo.rut_reclamante ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Tipo de reclamo</dt>
            <dd className="text-text">{reclamo.tipo_reclamo}</dd>
          </div>
          <div>
            <dt className="text-muted">Dirección</dt>
            <dd className="text-text">{reclamo.direccion_reclamo ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Fecha recepción</dt>
            <dd className="text-text">
              {formatearFechaHora(reclamo.fecha_recepcion)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Plazo vencimiento</dt>
            <dd className="text-text">
              {formatearFecha(reclamo.plazo_vencimiento)}
            </dd>
          </div>
        </dl>

        <div>
          <dt className="text-muted text-sm">Descripción</dt>
          <dd className="text-text">{reclamo.descripcion}</dd>
        </div>

        {reclamo.observaciones && (
          <div>
            <dt className="text-muted text-sm">Observaciones</dt>
            <dd className="text-text">{reclamo.observaciones}</dd>
          </div>
        )}

        {reclamo.respuesta && (
          <div className="border-t border-border pt-4">
            <dt className="text-muted text-sm">Respuesta</dt>
            <dd className="text-text">{reclamo.respuesta}</dd>
            <p className="text-xs text-muted mt-1">
              Respondido el {formatearFecha(reclamo.fecha_respuesta)} —{" "}
              {reclamo.dias_habiles_respuesta} días hábiles
              {reclamo.fuera_de_plazo
                ? " (fuera de plazo)"
                : " (dentro de plazo)"}
            </p>
          </div>
        )}

        {reclamo.motivo_cierre && (
          <div className="border-t border-border pt-4">
            <dt className="text-muted text-sm">
              Motivo de cierre sin respuesta
            </dt>
            <dd className="text-text">{reclamo.motivo_cierre}</dd>
          </div>
        )}

        {historial.length > 0 && (
          <div className="border-t border-border pt-4">
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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {reclamo.estado === "abierto" && (
          <div className="border-t border-border pt-4 space-y-3">
            {!mostrarFormRespuesta && !mostrarFormCierreDirecto && (
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarFormRespuesta(true)}
                  className="bg-primary text-white px-4 py-2 rounded"
                >
                  Responder
                </button>
                <button
                  onClick={() => setMostrarFormCierreDirecto(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-text text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                >
                  Cerrar sin respuesta
                </button>
              </div>
            )}

            {mostrarFormRespuesta && (
              <div className="space-y-2">
                <Textarea
                  label="Respuesta"
                  name="respuesta"
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  rows={4}
                  placeholder="Escribe la respuesta al reclamante..."
                />

                <div className="flex gap-3">
                  <button
                    onClick={handleResponder}
                    className="bg-primary text-white px-4 py-2 rounded"
                  >
                    Enviar respuesta
                  </button>
                  <button
                    onClick={() => setMostrarFormRespuesta(false)}
                    className="text-muted px-4 py-2"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {mostrarFormCierreDirecto && (
              <div className="space-y-2">
                <Textarea
                  label="Motivo de cierre"
                  name="motivo_cierre"
                  value={motivoCierre}
                  onChange={(e) => setMotivoCierre(e.target.value)}
                  rows={2}
                  placeholder="Motivo del cierre (ej. reclamo retirado, duplicado, no procede)..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCerrarSinRespuesta}
                    className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                  >
                    Confirmar cierre
                  </button>
                  <button
                    onClick={() => setMostrarFormCierreDirecto(false)}
                    className="text-muted px-4 py-2"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {reclamo.estado === "respondido" && (
          <div className="border-t border-border pt-4">
            <button
              onClick={handleCerrar}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              Cerrar reclamo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
