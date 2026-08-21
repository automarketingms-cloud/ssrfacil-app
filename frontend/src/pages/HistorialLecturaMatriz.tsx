import { useEffect, useState } from "react";
import type { LecturaMatriz, LecturaMatrizUpdate } from "../types";
import {
  listarLecturasMatriz,
  actualizarLecturaMatriz,
  obtenerFotoLecturaMatriz,
} from "../api/lecturaMatriz";

export default function HistorialLecturaMatriz() {
  const [lecturas, setLecturas] = useState<LecturaMatriz[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [anio, setAnio] = useState(new Date().getFullYear());

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formEdit, setFormEdit] = useState<LecturaMatrizUpdate>({});
  const [guardando, setGuardando] = useState(false);

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState<number | null>(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {
    setCargando(true);
    setError(null);
    try {
      const data = await listarLecturasMatriz();
      setLecturas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el historial");
    } finally {
      setCargando(false);
    }
  }

  function iniciarEdicion(l: LecturaMatriz) {
    setEditandoId(l.id);
    setFormEdit({
      fecha_lectura: l.fecha_lectura,
      lectura_actual: l.lectura_actual,
      observaciones: l.observaciones ?? "",
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormEdit({});
  }

  async function guardarEdicion(lecturaId: number) {
    setGuardando(true);
    setError(null);
    try {
      await actualizarLecturaMatriz(lecturaId, formEdit);
      await cargarHistorial();
      setEditandoId(null);
      setFormEdit({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar cambios");
    } finally {
      setGuardando(false);
    }
  }

  async function verFoto(lecturaId: number) {
    setCargandoFoto(lecturaId);
    setError(null);
    try {
      const url = await obtenerFotoLecturaMatriz(lecturaId);
      setFotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la foto");
    } finally {
      setCargandoFoto(null);
    }
  }

  const lecturasDelAnio = lecturas.filter((l) =>
    l.periodo.startsWith(String(anio)),
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-text mb-6">
        Historial Lectura Matriz
      </h1>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setAnio((a) => a - 1)}
          className="px-2 py-1 rounded-lg border border-border text-text hover:bg-primary-light/40"
          aria-label="Año anterior"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-text w-12 text-center">
          {anio}
        </span>
        <button
          onClick={() => setAnio((a) => a + 1)}
          className="px-2 py-1 rounded-lg border border-border text-text hover:bg-primary-light/40"
          aria-label="Año siguiente"
        >
          ›
        </button>
        {anio !== new Date().getFullYear() && (
          <button
            onClick={() => setAnio(new Date().getFullYear())}
            className="text-sm font-medium text-primary-dark hover:underline ml-1"
          >
            Volver al año actual
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <p className="mb-4 text-xs text-muted">
        Al editar la lectura, se recalcula el consumo de ese período y, si
        existe, el del período siguiente.
      </p>

      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : lecturasDelAnio.length === 0 ? (
        <p className="text-muted">
          No hay lecturas matriz registradas para {anio}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-primary-light/40 text-text">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Periodo</th>
                <th className="text-left px-4 py-2 font-medium">Fecha</th>
                <th className="text-right px-4 py-2 font-medium">Lectura</th>
                <th className="text-right px-4 py-2 font-medium">
                  Consumo (m³)
                </th>
                <th className="text-left px-4 py-2 font-medium">
                  Observaciones
                </th>
                <th className="text-right px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lecturasDelAnio.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  {editandoId === l.id ? (
                    <>
                      <td className="px-4 py-2 text-text">{l.periodo}</td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={formEdit.fecha_lectura ?? ""}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              fecha_lectura: e.target.value,
                            })
                          }
                          className="w-32 border border-border rounded-lg px-2 py-1.5 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={formEdit.lectura_actual ?? ""}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              lectura_actual: Number(e.target.value),
                            })
                          }
                          className="w-24 border border-border rounded-lg px-2 py-1.5 bg-surface text-text text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-muted">—</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formEdit.observaciones ?? ""}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              observaciones: e.target.value,
                            })
                          }
                          className="w-full border border-border rounded-lg px-2 py-1.5 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => guardarEdicion(l.id)}
                            disabled={guardando}
                            className="text-primary hover:text-primary-dark font-medium disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            disabled={guardando}
                            className="text-muted hover:text-text disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-text">{l.periodo}</td>
                      <td className="px-4 py-2 text-text">{l.fecha_lectura}</td>
                      <td className="px-4 py-2 text-right text-text">
                        {l.lectura_actual}
                      </td>
                      <td className="px-4 py-2 text-right text-text">
                        {l.consumo_m3}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {l.observaciones || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          {l.tiene_foto && (
                            <button
                              onClick={() => verFoto(l.id)}
                              disabled={cargandoFoto === l.id}
                              className="text-primary hover:text-primary-dark font-medium disabled:opacity-50"
                            >
                              {cargandoFoto === l.id
                                ? "Cargando..."
                                : "Ver foto"}
                            </button>
                          )}
                          <button
                            onClick={() => iniciarEdicion(l)}
                            className="text-primary hover:text-primary-dark font-medium"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && lecturasDelAnio.length > 0 && (
        <p className="text-xs text-muted mt-3">
          {lecturasDelAnio.length} lectura
          {lecturasDelAnio.length !== 1 ? "s" : ""} en {anio}
        </p>
      )}

      {fotoUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoUrl(null)}
        >
          <div className="max-w-2xl max-h-[90vh] flex flex-col items-center gap-3">
            <img
              src={fotoUrl}
              alt="Foto del medidor matriz"
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setFotoUrl(null)}
              className="bg-white text-text px-4 py-2 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
