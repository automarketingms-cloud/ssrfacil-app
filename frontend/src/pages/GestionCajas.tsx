import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Loader2, Lock, ClipboardCheck, FileText } from "lucide-react";
import { obtenerCajasEmpresa, cerrarCaja, arquearCaja } from "../api/cajas";
import type { CajaConCajero } from "../types";

function formatearMonto(valor: number): string {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Filtro = "todas" | "abierta" | "cerrada";

export default function GestionCajas() {
  const navigate = useNavigate();
  const [cajas, setCajas] = useState<CajaConCajero[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("abierta");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cerrandoId, setCerrandoId] = useState<number | null>(null);
  const [observacionesCierre, setObservacionesCierre] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [arqueandoId, setArqueandoId] = useState<number | null>(null);
  const [observacionesArqueo, setObservacionesArqueo] = useState("");

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const estado = filtro === "todas" ? undefined : filtro;
      const data = await obtenerCajasEmpresa(estado);
      setCajas(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar las cajas",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function handleCerrar(cajaId: number) {
    setEnviando(true);
    setError(null);
    try {
      await cerrarCaja(cajaId, {
        observaciones_cierre: observacionesCierre || undefined,
      });
      setCerrandoId(null);
      setObservacionesCierre("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar la caja");
    } finally {
      setEnviando(false);
    }
  }

  async function handleArquear(cajaId: number) {
    setEnviando(true);
    setError(null);
    try {
      await arquearCaja(cajaId, {
        observaciones_arqueo: observacionesArqueo || undefined,
      });
      setArqueandoId(null);
      setObservacionesArqueo("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al arquear la caja");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Gestión de Cajas</h1>
        <p className="text-sm text-muted">
          Cajas de todos los cajeros de la empresa — cierra o arquea las que
          hayan quedado pendientes
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {(["abierta", "cerrada", "todas"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              filtro === f
                ? "bg-primary text-white border-primary"
                : "border-border text-text hover:bg-bg"
            }`}
          >
            {f === "todas"
              ? "Todas"
              : f === "abierta"
                ? "Abiertas"
                : "Cerradas"}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2 mb-4 max-w-md">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" />
          Cargando...
        </div>
      ) : cajas.length === 0 ? (
        <p className="text-sm text-muted">No hay cajas para este filtro.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cajas.map((c) => (
            <li
              key={c.id}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-primary-dark" />
                  <span className="font-medium text-text text-sm">
                    {c.cajero_nombre}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    c.estado === "abierta"
                      ? "bg-primary-light text-primary-dark"
                      : "bg-success-soft text-success"
                  }`}
                >
                  {c.estado === "abierta" ? "Abierta" : "Cerrada"}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-sm mt-2">
                <div className="flex justify-between">
                  <span className="text-muted">Apertura</span>
                  <span className="text-text">
                    {formatearFechaHora(c.fecha_apertura)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Monto inicial</span>
                  <span className="text-text">
                    {formatearMonto(c.monto_inicial)}
                  </span>
                </div>
                {c.estado === "cerrada" && (
                  <div className="flex justify-between">
                    <span className="text-muted">Efectivo esperado</span>
                    <span className="text-text">
                      {formatearMonto(c.monto_efectivo_esperado ?? 0)}
                    </span>
                  </div>
                )}
              </div>

              {c.estado === "abierta" && (
                <div className="mt-3 border-t border-border pt-3">
                  {cerrandoId !== c.id ? (
                    <button
                      onClick={() => setCerrandoId(c.id)}
                      className="flex items-center gap-2 text-sm font-medium text-primary-dark hover:underline"
                    >
                      <Lock size={16} />
                      Cerrar esta caja
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={observacionesCierre}
                        onChange={(e) => setObservacionesCierre(e.target.value)}
                        placeholder="Observaciones (opcional)"
                        className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCerrandoId(null);
                            setObservacionesCierre("");
                          }}
                          className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-text hover:bg-bg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleCerrar(c.id)}
                          disabled={enviando}
                          className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-60"
                        >
                          {enviando ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Lock size={14} />
                          )}
                          Confirmar cierre
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {c.estado === "cerrada" && (
                <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                  {c.fecha_arqueo ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <ClipboardCheck size={13} />
                        Arqueada el {formatearFechaHora(c.fecha_arqueo)}
                      </span>
                      <button
                        onClick={() => navigate(`/caja/${c.id}`)}
                        className="flex items-center gap-1 text-xs font-medium text-primary-dark hover:underline"
                      >
                        <FileText size={13} />
                        Ver detalle
                      </button>
                    </>
                  ) : arqueandoId !== c.id ? (
                    <button
                      onClick={() => setArqueandoId(c.id)}
                      className="flex items-center gap-2 text-sm font-medium text-primary-dark hover:underline"
                    >
                      <ClipboardCheck size={16} />
                      Arquear caja
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        type="text"
                        value={observacionesArqueo}
                        onChange={(e) => setObservacionesArqueo(e.target.value)}
                        placeholder="Observaciones (opcional)"
                        className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setArqueandoId(null);
                            setObservacionesArqueo("");
                          }}
                          className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-text hover:bg-bg"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleArquear(c.id)}
                          disabled={enviando}
                          className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-60"
                        >
                          {enviando ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ClipboardCheck size={14} />
                          )}
                          Confirmar arqueo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
