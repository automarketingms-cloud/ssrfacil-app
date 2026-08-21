import { useEffect, useState } from "react";
import {
  obtenerComparativa,
  obtenerComparativaHistorica,
  obtenerComparativaAnual,
  obtenerComparativaTotal,
} from "../api/lecturaMatriz";
import type {
  ComparativaAgua as ComparativaAguaType,
  ComparativaAnual,
  ComparativaAguaResumen,
} from "../types";
import GaugeCircular from "../components/GaugeCircular";

function periodoActual(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function ComparativaAgua() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [comparativa, setComparativa] = useState<ComparativaAguaType | null>(
    null,
  );
  const [historico, setHistorico] = useState<ComparativaAguaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [comparativaAnual, setComparativaAnual] =
    useState<ComparativaAnual | null>(null);
  const [comparativaTotal, setComparativaTotal] =
    useState<ComparativaAguaResumen | null>(null);

  useEffect(() => {
    cargarComparativa();
  }, [periodo]);

  useEffect(() => {
    cargarHistorico();
  }, []);

  useEffect(() => {
    obtenerComparativaAnual(anio)
      .then(setComparativaAnual)
      .catch((e) => {
        console.error("Error comparativa anual:", e);
        setComparativaAnual(null);
      });
  }, [anio]);

  useEffect(() => {
    obtenerComparativaTotal()
      .then(setComparativaTotal)
      .catch((e) => {
        console.error("Error comparativa total:", e);
        setComparativaTotal(null);
      });
  }, []);

  async function cargarComparativa() {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerComparativa(periodo);
      setComparativa(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar la comparativa",
      );
      setComparativa(null);
    } finally {
      setLoading(false);
    }
  }

  async function cargarHistorico() {
    try {
      const data = await obtenerComparativaHistorica(6);
      setHistorico(data);
    } catch {
      // el histórico es complementario, no bloquea la vista principal
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Agua No Facturada</h1>
          <p className="text-sm text-muted">
            Comparativa entre el medidor matriz y el consumo sumado de todos los
            clientes
          </p>
        </div>
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
        />
      </div>

      {loading && <p className="text-sm text-muted">Cargando comparativa...</p>}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {comparativa && !loading && !error && (
        <>
          {!comparativa.tiene_lectura_matriz && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              No hay lectura matriz registrada para este período. Los valores se
              muestran en 0.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TarjetaResumen
              titulo="Consumo Matriz"
              valor={`${comparativa.consumo_matriz_m3.toFixed(1)} m³`}
            />
            <TarjetaResumen
              titulo="Consumo Clientes"
              valor={`${comparativa.consumo_clientes_m3.toFixed(1)} m³`}
            />
            <TarjetaResumen
              titulo="Agua No Facturada"
              valor={`${comparativa.agua_no_facturada_m3.toFixed(1)} m³`}
              destacar={comparativa.agua_no_facturada_m3 > 0}
            />
          </div>

          <div className="flex justify-center rounded-lg border border-border bg-surface p-6">
            <GaugeCircular
              porcentaje={comparativa.porcentaje_perdida}
              tamano={160}
              label={`% Pérdida — ${periodo}`}
            />
          </div>

          {historico.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-4 text-sm font-semibold text-text">
                Tendencia últimos {historico.length} períodos
              </h2>
              <div className="flex flex-wrap justify-around gap-4">
                {historico.map((h) => (
                  <GaugeCircular
                    key={h.periodo}
                    porcentaje={h.porcentaje_perdida}
                    tamano={90}
                    label={h.periodo}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">
                Comparativa Anual
              </h2>
              <select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text"
              >
                {Array.from({ length: 5 }, (_, i) =>
                  String(new Date().getFullYear() - i),
                ).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-around gap-6">
              {comparativaAnual?.tiene_datos ? (
                <GaugeCircular
                  porcentaje={comparativaAnual.porcentaje_perdida}
                  tamano={130}
                  label={`Año ${anio}`}
                />
              ) : (
                <p className="text-sm text-muted">
                  Sin datos de lectura matriz para {anio}
                </p>
              )}
              {comparativaTotal?.tiene_datos && (
                <GaugeCircular
                  porcentaje={comparativaTotal.porcentaje_perdida}
                  tamano={130}
                  label="Total histórico"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  destacar = false,
}: {
  titulo: string;
  valor: string;
  destacar?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted">{titulo}</p>
      <p
        className={`mt-1 text-lg font-semibold ${destacar ? "text-red-600" : "text-text"}`}
      >
        {valor}
      </p>
    </div>
  );
}
