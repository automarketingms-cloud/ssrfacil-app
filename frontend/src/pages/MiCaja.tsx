import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Loader2,
  Lock,
  LockOpen,
  History,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import {
  abrirCaja,
  obtenerCajaAbierta,
  cerrarCaja,
  arquearCaja,
  obtenerPdfArqueo,
  obtenerResumenCaja,
  obtenerHistorialCajas,
} from "../api/cajas";
import type { Caja, CajaResumen } from "../types";

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

export default function MiCaja() {
  const navigate = useNavigate();
  const [caja, setCaja] = useState<Caja | null>(null);
  const [resumen, setResumen] = useState<CajaResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [montoInicial, setMontoInicial] = useState("");

  const [mostrarFormCierre, setMostrarFormCierre] = useState(false);
  const [observacionesCierre, setObservacionesCierre] = useState("");

  const [cajaRecienCerrada, setCajaRecienCerrada] = useState<Caja | null>(null);

  const [historialCajas, setHistorialCajas] = useState<Caja[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [arqueoAbiertoId, setArqueoAbiertoId] = useState<number | null>(null);
  const [observacionesArqueo, setObservacionesArqueo] = useState("");
  const [enviandoArqueo, setEnviandoArqueo] = useState(false);
  const [cargandoPdfId, setCargandoPdfId] = useState<number | null>(null);

  async function cargarEstado() {
    setCargando(true);
    setError(null);
    try {
      const cajaAbierta = await obtenerCajaAbierta();
      setCaja(cajaAbierta);
      if (cajaAbierta) {
        const r = await obtenerResumenCaja(cajaAbierta.id);
        setResumen(r);
      } else {
        setResumen(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar el estado de caja",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarHistorial() {
    setLoadingHistorial(true);
    try {
      const data = await obtenerHistorialCajas();
      setHistorialCajas(data);
    } catch {
      // no bloqueamos la página si falla esto
    } finally {
      setLoadingHistorial(false);
    }
  }

  useEffect(() => {
    cargarEstado();
    cargarHistorial();
  }, []);

  async function handleAbrir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setEnviando(true);
    try {
      await abrirCaja({ monto_inicial: Number(montoInicial) });
      setMontoInicial("");
      setExito("Caja abierta correctamente");
      setCajaRecienCerrada(null);
      await cargarEstado();
      cargarHistorial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al abrir la caja");
    } finally {
      setEnviando(false);
    }
  }

  async function handleCerrar(e: React.FormEvent) {
    e.preventDefault();
    if (!caja) return;
    setError(null);
    setExito(null);
    setEnviando(true);
    try {
      const cerrada = await cerrarCaja(caja.id, {
        observaciones_cierre: observacionesCierre || undefined,
      });
      setCajaRecienCerrada(cerrada);
      setExito("Caja cerrada correctamente");
      setMostrarFormCierre(false);
      setObservacionesCierre("");
      await cargarEstado();
      cargarHistorial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar la caja");
    } finally {
      setEnviando(false);
    }
  }

  async function handleArquear(cajaId: number) {
    setError(null);
    setEnviandoArqueo(true);
    try {
      await arquearCaja(cajaId, {
        observaciones_arqueo: observacionesArqueo || undefined,
      });
      setArqueoAbiertoId(null);
      setObservacionesArqueo("");
      navigate(`/caja/${cajaId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al arquear la caja");
    } finally {
      setEnviandoArqueo(false);
    }
  }

  function handleVerDetalle(cajaId: number) {
    navigate(`/caja/${cajaId}`);
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Mi Caja</h1>
        <p className="text-sm text-muted">
          Abre tu turno antes de registrar pagos y ciérralo al terminar
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2 mb-4 max-w-md">
          {error}
        </div>
      )}
      {exito && (
        <div className="text-sm text-success bg-success-soft border border-success/30 rounded-lg px-3 py-2 mb-4 max-w-md">
          {exito}
        </div>
      )}

      {/* Resumen del cierre recién hecho */}
      {cajaRecienCerrada && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4 max-w-md">
          <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Lock size={16} />
            Caja cerrada
          </h2>
          <div className="flex flex-col gap-1 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-muted">Efectivo esperado</span>
              <span className="font-medium text-text">
                {formatearMonto(cajaRecienCerrada.monto_efectivo_esperado ?? 0)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted mb-3">
            Cuenta el efectivo físico y compáralo contra el monto esperado. Si
            hay diferencia, avísalo internamente. Cuando termines, confirma el
            arqueo.
          </p>
          <BloqueArqueo
            abierto={arqueoAbiertoId === cajaRecienCerrada.id}
            onAbrir={() => setArqueoAbiertoId(cajaRecienCerrada.id)}
            observaciones={observacionesArqueo}
            onObservacionesChange={setObservacionesArqueo}
            enviando={enviandoArqueo}
            onConfirmar={() => handleArquear(cajaRecienCerrada.id)}
            onCancelar={() => {
              setArqueoAbiertoId(null);
              setObservacionesArqueo("");
            }}
          />
        </div>
      )}

      {!caja ? (
        <form
          onSubmit={handleAbrir}
          className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 max-w-md"
        >
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <LockOpen size={16} />
            Abrir caja
          </h2>
          <label className="text-xs text-muted">Monto inicial</label>
          <input
            type="number"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            min={0}
            step="1"
            required
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
          />
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 mt-2"
          >
            {enviando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            Abrir caja
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Estado actual */}
          <div className="bg-surface border border-border rounded-xl p-4 h-fit">
            <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <LockOpen size={16} />
              Caja abierta
            </h2>
            <div className="flex flex-col gap-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Apertura</span>
                <span className="text-text">
                  {formatearFechaHora(caja.fecha_apertura)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Monto inicial</span>
                <span className="font-medium text-text">
                  {formatearMonto(caja.monto_inicial)}
                </span>
              </div>
            </div>

            {resumen && resumen.resumen_por_metodo.length > 0 && (
              <div className="border-t border-border pt-3 mb-3">
                <p className="text-xs font-semibold text-muted mb-2">
                  Pagos registrados en este turno
                </p>
                <ul className="flex flex-col gap-1">
                  {resumen.resumen_por_metodo.map((r) => (
                    <li
                      key={r.metodo_pago}
                      className="flex justify-between text-sm"
                    >
                      <span className="capitalize text-text">
                        {r.metodo_pago.replace("_", " ")} ({r.cantidad})
                      </span>
                      <span className="font-medium text-text">
                        {formatearMonto(r.total)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-sm font-semibold text-text border-t border-border mt-2 pt-2">
                  <span>Total</span>
                  <span>{formatearMonto(resumen.total_general)}</span>
                </div>
              </div>
            )}

            {!mostrarFormCierre && (
              <button
                onClick={() => setMostrarFormCierre(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Lock size={16} />
                Cerrar caja
              </button>
            )}
          </div>

          {/* Form de cierre */}
          {mostrarFormCierre && (
            <form
              onSubmit={handleCerrar}
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 h-fit"
            >
              <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                <Lock size={16} />
                Cerrar caja
              </h2>
              <p className="text-xs text-muted">
                Al cerrar se guarda el efectivo esperado según lo registrado en
                el turno. El arqueo (conteo físico) se hace después de cerrar.
              </p>

              <label className="text-xs text-muted">
                Observaciones (opcional)
              </label>
              <input
                type="text"
                value={observacionesCierre}
                onChange={(e) => setObservacionesCierre(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormCierre(false)}
                  className="flex-1 text-sm font-medium px-4 py-2 rounded-lg border border-border text-text hover:bg-bg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  {enviando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lock size={16} />
                  )}
                  Confirmar cierre
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-4 mt-4">
        <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <History size={16} />
          Historial de mis cajas
        </h2>
        {loadingHistorial ? (
          <p className="text-sm text-muted">Cargando...</p>
        ) : historialCajas.length === 0 ? (
          <p className="text-sm text-muted">Sin cajas registradas aún.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historialCajas.map((c) => (
              <li
                key={c.id}
                className="border border-border rounded-lg px-3 py-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text">
                    {formatearFechaHora(c.fecha_apertura)}
                  </span>
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
                <div className="flex items-center justify-between mt-1 text-xs text-muted">
                  <span>Inicial: {formatearMonto(c.monto_inicial)}</span>
                  {c.estado === "cerrada" && (
                    <span>
                      Esperado: {formatearMonto(c.monto_efectivo_esperado ?? 0)}
                    </span>
                  )}
                </div>

                {c.estado === "cerrada" && (
                  <div className="mt-2 flex items-center justify-between">
                    {c.fecha_arqueo ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <ClipboardCheck size={13} />
                          Arqueada el {formatearFechaHora(c.fecha_arqueo)}
                        </span>
                        <button
                          onClick={() => handleVerDetalle(c.id)}
                          disabled={cargandoPdfId === c.id}
                          className="flex items-center gap-1 text-xs font-medium text-primary-dark hover:underline disabled:opacity-60"
                        >
                          {cargandoPdfId === c.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <FileText size={13} />
                          )}
                          Ver detalle
                        </button>
                      </>
                    ) : (
                      <BloqueArqueo
                        abierto={arqueoAbiertoId === c.id}
                        onAbrir={() => setArqueoAbiertoId(c.id)}
                        observaciones={observacionesArqueo}
                        onObservacionesChange={setObservacionesArqueo}
                        enviando={enviandoArqueo}
                        onConfirmar={() => handleArquear(c.id)}
                        onCancelar={() => {
                          setArqueoAbiertoId(null);
                          setObservacionesArqueo("");
                        }}
                        compacto
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface BloqueArqueoProps {
  abierto: boolean;
  onAbrir: () => void;
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  enviando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  compacto?: boolean;
}

function BloqueArqueo({
  abierto,
  onAbrir,
  observaciones,
  onObservacionesChange,
  enviando,
  onConfirmar,
  onCancelar,
  compacto = false,
}: BloqueArqueoProps) {
  if (!abierto) {
    return (
      <button
        onClick={onAbrir}
        className={`flex items-center gap-2 text-sm font-medium text-primary-dark hover:underline ${
          compacto
            ? ""
            : "w-full justify-center border border-border rounded-lg py-2 hover:bg-bg"
        }`}
      >
        <ClipboardCheck size={16} />
        Arquear caja
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-1 w-full">
      <label className="text-xs text-muted">Observaciones (opcional)</label>
      <input
        type="text"
        value={observaciones}
        onChange={(e) => onObservacionesChange(e.target.value)}
        placeholder="Ej: conteo ok, sin novedad"
        className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-text hover:bg-bg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={enviando}
          className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
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
  );
}
