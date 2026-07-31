import { useEffect, useState } from "react";
import type { Cliente, Lectura, LecturaUpdate } from "../types";
import { listarClientes } from "../api/clientes";
import { obtenerHistorialLecturas, editarLectura } from "../api/lecturas";

export default function HistorialLecturas() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<number | "">("");
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formEdit, setFormEdit] = useState<LecturaUpdate>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarClientes({ activo: true })
      .then(setClientes)
      .catch(() => setError("No se pudo cargar la lista de clientes"));
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [clienteId]);

  async function cargarHistorial() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerHistorialLecturas(
        clienteId === "" ? undefined : clienteId,
      );
      setLecturas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el historial");
    } finally {
      setCargando(false);
    }
  }

  function iniciarEdicion(l: Lectura) {
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

  const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));
  const mostrarColumnaCliente = clienteId === "";

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-text mb-6">
        Historial de Lecturas
      </h1>

      <div className="mb-6">
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

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-muted">Cargando...</p>
      ) : lecturas.length === 0 ? (
        <p className="text-muted">No hay lecturas para mostrar.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-bg text-muted">
              <tr>
                {mostrarColumnaCliente && (
                  <th className="text-left px-4 py-2">Cliente</th>
                )}
                <th className="text-left px-4 py-2">Periodo</th>
                <th className="text-left px-4 py-2">Fecha</th>
                <th className="text-right px-4 py-2">Lectura</th>
                <th className="text-right px-4 py-2">Consumo (m³)</th>
                <th className="text-right px-4 py-2">Acciones</th>
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
                          className="w-24 border border-border rounded px-2 py-1 bg-surface text-text"
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
                          className="border border-border rounded px-2 py-1 bg-surface text-text"
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
                          className="w-24 border border-border rounded px-2 py-1 text-right bg-surface text-text"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-muted">—</td>
                      <td className="px-4 py-2 text-right space-x-3">
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
                      </td>
                    </>
                  ) : (
                    <>
                      {mostrarColumnaCliente && (
                        <td className="px-4 py-2 text-text">
                          {clienteMap.get(l.cliente_id) ?? "—"}
                        </td>
                      )}
                      <td className="px-4 py-2 text-text">{l.periodo}</td>
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
                        <button
                          onClick={() => iniciarEdicion(l)}
                          className="text-primary hover:text-primary-dark font-medium"
                        >
                          Editar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
