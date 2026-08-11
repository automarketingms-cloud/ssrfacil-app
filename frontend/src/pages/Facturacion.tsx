import { useEffect, useState } from "react";
import { FileText, Loader2, AlertTriangle } from "lucide-react";
import { generarFacturasPeriodo, listarFacturas } from "../api/facturas";
import type { Factura, ResumenGeneracionFacturas } from "../types";
import { Link } from "react-router-dom";

function periodoActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
}

function formatearMonto(valor: number): string {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function hoyStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function corteEnTramite(f: Factura): boolean {
  return (
    !!f.fecha_limite_corte &&
    f.fecha_limite_corte < hoyStr() &&
    f.estado !== "pagada"
  );
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-success-soft text-success",
  vencida: "bg-danger-soft text-danger",
};

export default function Facturacion() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [resumen, setResumen] = useState<ResumenGeneracionFacturas | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function cargarFacturas() {
    setLoading(true);
    setError(null);
    try {
      const data = await listarFacturas({
        periodo: periodo || undefined,
        estado: estadoFiltro || undefined,
      });
      setFacturas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, estadoFiltro]);

  async function handleGenerar() {
    setGenerando(true);
    setError(null);
    setResumen(null);
    try {
      const res = await generarFacturasPeriodo(periodo);
      setResumen(res);
      await cargarFacturas();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al generar facturas",
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Facturación</h1>
          <p className="text-sm text-muted">
            Emisión y estado de facturas por período
          </p>
        </div>
        <button
          onClick={handleGenerar}
          disabled={generando}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {generando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          Generar facturas del período
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
          <option value="vencida">Vencida</option>
          <option value="parcial">Parcial</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {/* Resumen de la última generación */}
      {resumen && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4">
          <p className="text-sm text-text mb-2">
            <span className="font-semibold text-success">
              {resumen.cantidad_generadas} factura(s) generada(s)
            </span>
            {resumen.cantidad_fallidas > 0 && (
              <span className="text-danger ml-2">
                — {resumen.cantidad_fallidas} fallida(s)
              </span>
            )}
          </p>
          {resumen.fallidas.length > 0 && (
            <ul className="text-xs text-muted flex flex-col gap-1 mt-2">
              {resumen.fallidas.map((f) => (
                <li key={f.cliente_id}>
                  Cliente #{f.cliente_id}: {f.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabla de facturas */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted p-4">Cargando facturas...</p>
        ) : facturas.length === 0 ? (
          <p className="text-sm text-muted p-4">
            No hay facturas para este filtro.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Emisión</th>
                <th className="text-left px-4 py-2">Vencimiento</th>
                <th className="text-right px-4 py-2">Arrastre</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-left px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => {
                console.log(f.cliente_id, f.tipo_facturacion);
                const tieneArrastre =
                  f.saldo_anterior > 0 || f.interes_mora > 0;
                return (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-4 py-2 text-text">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/facturas/${f.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {f.nombre_cliente ?? `#${f.cliente_id}`}
                        </Link>
                        {f.tipo_facturacion === "termino_medio" && (
                          <span
                            className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5"
                            title="Facturado por consumo promedio (no se pudo leer el medidor)"
                          >
                            Término medio
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted">{f.fecha_emision}</td>
                    <td className="px-4 py-2">
                      {corteEnTramite(f) ? (
                        <span className="text-xs font-semibold text-danger">
                          Corte en Trámite
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted">
                            {f.fecha_vencimiento}
                          </span>
                          {f.mensaje_boleta && (
                            <span title={f.mensaje_boleta}>
                              <AlertTriangle
                                size={14}
                                className="text-amber-500"
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {tieneArrastre ? (
                        <span
                          className="text-xs text-danger"
                          title={`Saldo anterior: ${formatearMonto(f.saldo_anterior)} · Interés por mora: ${formatearMonto(f.interes_mora)}`}
                        >
                          {formatearMonto(f.saldo_anterior + f.interes_mora)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-text">
                      {formatearMonto(f.total_a_pagar)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[f.estado]}`}
                      >
                        {f.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
