import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  obtenerReclamo,
  responderReclamo,
  cerrarReclamo,
  cerrarReclamoSinRespuesta,
  type Reclamo,
} from "../api/reclamos";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  abierto: "Abierto",
  respondido: "Respondido",
  cerrado: "Cerrado",
  cerrado_sin_respuesta: "Cerrado sin respuesta",
};

export default function DetalleReclamo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reclamo, setReclamo] = useState<Reclamo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [mostrarFormRespuesta, setMostrarFormRespuesta] = useState(false);

  const [motivoCierre, setMotivoCierre] = useState("");
  const [mostrarFormCierreDirecto, setMostrarFormCierreDirecto] =
    useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const datos = await obtenerReclamo(Number(id));
      setReclamo(datos);
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
    reclamo.estado === "abierto" && reclamo.plazo_vencimiento < hoyISO();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate("/reclamos")}
        className="text-primary text-sm mb-4"
      >
        ← Volver al listado
      </button>

      <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text">
            Reclamo {reclamo.folio}
          </h1>
          <span className="px-3 py-1 rounded text-sm bg-gray-100 text-text">
            {ETIQUETAS_ESTADO[reclamo.estado]}
          </span>
        </div>

        {fueraDePlazo && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
            Este reclamo está fuera del plazo normativo de respuesta (venció el{" "}
            {reclamo.plazo_vencimiento}).
          </div>
        )}

        <dl className="grid grid-cols-2 gap-4 text-sm">
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
              {reclamo.fecha_recepcion.slice(0, 10)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Plazo vencimiento</dt>
            <dd className="text-text">{reclamo.plazo_vencimiento}</dd>
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
              Respondido el {reclamo.fecha_respuesta?.slice(0, 10)} —{" "}
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
                  className="bg-gray-100 text-text px-4 py-2 rounded"
                >
                  Cerrar sin respuesta
                </button>
              </div>
            )}

            {mostrarFormRespuesta && (
              <div className="space-y-2">
                <textarea
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2"
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
                <textarea
                  value={motivoCierre}
                  onChange={(e) => setMotivoCierre(e.target.value)}
                  className="w-full border border-border rounded px-3 py-2"
                  rows={2}
                  placeholder="Motivo del cierre (ej. reclamo retirado, duplicado, no procede)..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCerrarSinRespuesta}
                    className="bg-gray-800 text-white px-4 py-2 rounded"
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
