import { useEffect, useState } from "react";
import type { Cliente, Lectura, LecturaUpdate } from "../types";
import { listarClientes } from "../api/clientes";
import {
  obtenerHistorialLecturas,
  editarLectura,
  obtenerFotoLectura,
} from "../api/lecturas";

const LIMIT = 500;

function periodoActual(): string {
  return new Date().toISOString().slice(0, 7); // "2026-08"
}

function anioActual(): number {
  return new Date().getFullYear();
}

type ModoVista = "mes" | "anio";

export default function HistorialLecturas() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modo, setModo] = useState<ModoVista>("mes");
  const [periodo, setPeriodo] = useState(periodoActual());
  const [viendoOtroMes, setViendoOtroMes] = useState(false);
  const [anio, setAnio] = useState(anioActual());

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formEdit, setFormEdit] = useState<LecturaUpdate>({});
  const [guardando, setGuardando] = useState(false);

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState<number | null>(null);

  useEffect(() => {
    listarClientes({ activo: true, limit: 1000 })
      .then((data) => setClientes(data.items))
      .catch(() => setError("No se pudo cargar la lista de clientes"));
  }, []);

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, periodo, anio, modo]);

  async function cargarHistorial() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerHistorialLecturas({
        clienteId: clienteId === "" ? undefined : clienteId,
        periodo: modo === "mes" ? periodo : undefined,
        anio: modo === "anio" ? String(anio) : undefined,
        limit: LIMIT,
      });
      setLecturas(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el historial");
    } finally {
      setCargando(false);
    }
  }

  function volverAMesActual() {
    setPeriodo(periodoActual());
    setViendoOtroMes(false);
  }

  function iniciarEdicion(l: Lectura) {
    if (l.facturada) return;
    setEditandoId(l.id);
    setFormEdit({
      fecha_lectura: l.fecha_lectura,
      periodo: l.periodo,
      lectura_actual: l.lectura_actual,
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
      await editarLectura(lecturaId, formEdit);
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
      const url = await obtenerFotoLectura(lecturaId);
      setFotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la foto");
    } finally {
      setCargandoFoto(null);
    }
  }

  const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));
  const mostrarColumnaCliente = clienteId === "";
  const esMesActual = periodo === periodoActual();

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-text mb-6">
        Historial de Lecturas
      </h1>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Filtrar por cliente
          </label>
          <select
            value={clienteId}
            onChange={(e) =>
              setClienteId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full sm:w-72 border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.rut}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-1">
            Período
          </label>

          {modo === "mes" ? (
            viendoOtroMes ? (
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {!esMesActual && (
                  <button
                    onClick={volverAMesActual}
                    className="text-sm font-medium text-primary-dark hover:underline whitespace-nowrap"
                  >
                    Volver al mes actual
                  </button>
                )}
                <button
                  onClick={() => setModo("anio")}
                  className="text-sm font-medium text-primary-dark hover:underline whitespace-nowrap"
                >
                  Ver por año
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 h-[42px]">
                <span className="text-sm text-text">
                  Mostrando <span className="font-medium">{periodo}</span> (mes
                  actual)
                </span>
                <button
                  onClick={() => setViendoOtroMes(true)}
                  className="text-sm font-medium text-primary-dark hover:underline"
                >
                  Ver otro mes
                </button>
                <button
                  onClick={() => setModo("anio")}
                  className="text-sm font-medium text-primary-dark hover:underline"
                >
                  Ver por año
                </button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3 h-[42px]">
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
              <button
                onClick={() => {
                  setModo("mes");
                  setViendoOtroMes(false);
                  setPeriodo(periodoActual());
                }}
                className="text-sm font-medium text-primary-dark hover:underline"
              >
                Ver por mes
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : lecturas.length === 0 ? (
        <p className="text-muted">
          No hay lecturas para mostrar en este período.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-primary-light/40 text-text">
              <tr>
                {mostrarColumnaCliente && (
                  <th className="text-left px-4 py-2 font-medium">Cliente</th>
                )}
                <th className="text-left px-4 py-2 font-medium">Periodo</th>
                <th className="text-left px-4 py-2 font-medium">Fecha</th>
                <th className="text-right px-4 py-2 font-medium">Lectura</th>
                <th className="text-right px-4 py-2 font-medium">
                  Consumo (m³)
                </th>
                <th className="text-right px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lecturas.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  {editandoId === l.id ? (
                    <>
                      {mostrarColumnaCliente && (
                        <td className="px-4 py-2 text-text">
                          {clienteMap.get(l.cliente_id) ?? "—"}
                        </td>
                      )}
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formEdit.periodo ?? ""}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              periodo: e.target.value,
                            })
                          }
                          className="w-24 border border-border rounded-lg px-2 py-1.5 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
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
                          className="w-24 border border-border rounded-lg px-2 py-1.5 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={formEdit.lectura_actual ?? ""}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              lectura_actual: Number(e.target.value),
                            })
                          }
                          className="w-24 border border-border rounded-lg px-2 py-1.5 bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-muted">—</td>
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
                      {mostrarColumnaCliente && (
                        <td className="px-4 py-2 text-text">
                          {clienteMap.get(l.cliente_id) ?? "—"}
                        </td>
                      )}
                      <td className="px-4 py-2 text-text">
                        <div className="flex items-center gap-2">
                          {l.periodo}
                          {l.es_promedio && (
                            <span
                              className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5"
                              title="Lectura estimada por término medio (no se pudo leer el medidor)"
                            >
                              Término medio
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-text">{l.fecha_lectura}</td>
                      <td className="px-4 py-2 text-right text-text">
                        {l.lectura_actual}
                      </td>
                      <td className="px-4 py-2 text-right text-text">
                        {l.consumo_m3 ?? (
                          <span
                            className="text-amber-600"
                            title="Consumo inconsistente"
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
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
                          {l.facturada ? (
                            <span
                              className="text-xs bg-slate-100 text-muted border border-border rounded-full px-2 py-0.5"
                              title="No se puede editar: el período ya fue facturado"
                            >
                              Facturada
                            </span>
                          ) : (
                            <button
                              onClick={() => iniciarEdicion(l)}
                              className="text-primary hover:text-primary-dark font-medium"
                            >
                              Editar
                            </button>
                          )}
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

      {fotoUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoUrl(null)}
        >
          <div className="max-w-2xl max-h-[90vh] flex flex-col items-center gap-3">
            <img
              src={fotoUrl}
              alt="Foto del medidor"
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

      {!cargando && total > 0 && (
        <p className="text-xs text-muted mt-3">
          {total} lectura{total !== 1 ? "s" : ""} en total
        </p>
      )}
    </div>
  );
}
