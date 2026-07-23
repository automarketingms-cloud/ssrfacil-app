import { useEffect, useState } from "react";
import Select from "../components/Select";
import Input from "../components/Input";
import { listarClientes } from "../api/clientes";
import { obtenerConsumo } from "../api/consumos";
import type { Cliente, ConsumoResponse } from "../types";

const currentPeriodo = new Date().toISOString().slice(0, 7);

function formatoCLP(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export default function VerConsumo() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [periodo, setPeriodo] = useState(currentPeriodo);
  const [consumo, setConsumo] = useState<ConsumoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarClientes()
      .then(setClientes)
      .catch(() => setError("No se pudo cargar la lista de clientes"))
      .finally(() => setLoadingClientes(false));
  }, []);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConsumo(null);

    try {
      const data = await obtenerConsumo(Number(clienteId), periodo);
      setConsumo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold text-text mb-1">Ver Consumo</h2>
      <p className="text-sm text-muted mb-6">
        Consulta el consumo y total a pagar de un cliente para un período.
      </p>

      <form
        onSubmit={handleBuscar}
        className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 mb-6"
      >
        <Select
          label="Cliente"
          name="cliente_id"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          required
          placeholder={
            loadingClientes ? "Cargando clientes..." : "Selecciona un cliente"
          }
          options={clientes.map((c) => ({
            value: c.id,
            label: `${c.nombre} — Medidor ${c.numero_medidor}`,
          }))}
        />

        <Input
          label="Período"
          name="periodo"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          required
          placeholder="2026-07"
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || loadingClientes}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {loading ? "Buscando..." : "Buscar consumo"}
        </button>
      </form>

      {consumo && (
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-text">
                {consumo.nombre_cliente}
              </h3>
              <p className="text-sm text-muted">
                Período {consumo.periodo} · Tarifa: {consumo.tarifa_aplicada}
              </p>
            </div>
            {consumo.es_socio && (
              <span className="text-xs font-medium bg-primary-light text-primary-dark px-2 py-1 rounded-full">
                Socio
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-y border-border py-4">
            <div>
              <p className="text-muted">Lectura anterior</p>
              <p className="text-text font-medium">
                {consumo.lectura_anterior} m³
              </p>
            </div>
            <div>
              <p className="text-muted">Lectura actual</p>
              <p className="text-text font-medium">
                {consumo.lectura_actual} m³
              </p>
            </div>
            <div>
              <p className="text-muted">Consumo total</p>
              <p className="text-text font-medium">{consumo.consumo_m3} m³</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Desglose de cobro</p>

            <div className="flex justify-between text-sm">
              <span className="text-muted">Cargo fijo</span>
              <span className="text-text">
                {formatoCLP(consumo.cargo_fijo)}
              </span>
            </div>

            {consumo.detalle_tramos.map((t) => (
              <div
                key={t.numero_tramo}
                className="flex justify-between text-sm"
              >
                <span className="text-muted">
                  Tramo {t.numero_tramo} ({t.m3_en_tramo} m³ ×{" "}
                  {formatoCLP(t.precio_m3)})
                </span>
                <span className="text-text">{formatoCLP(t.subtotal)}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm">
              <span className="text-muted">
                Total consumo ({consumo.consumo_m3} m³)
              </span>
              <span className="text-text">
                {formatoCLP(consumo.monto_variable)}
              </span>
            </div>

            <div className="flex justify-between text-sm font-medium border-t border-border pt-2 mt-1">
              <span className="text-text">Subtotal</span>
              <span className="text-text">
                {formatoCLP(consumo.cargo_fijo + consumo.monto_variable)}
              </span>
            </div>

            {consumo.subsidio_aplicado > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Descuento por subsidio</span>
                  <span className="text-red-600">
                    − {formatoCLP(consumo.subsidio_aplicado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Neto</span>
                  <span className="text-text">
                    {formatoCLP(consumo.subtotal_neto)}
                  </span>
                </div>
              </>
            )}

            {consumo.iva_aplicado > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">IVA (19%)</span>
                <span className="text-text">
                  {formatoCLP(consumo.iva_aplicado)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-base font-semibold border-t border-border pt-3 mt-1">
              <span className="text-text">Total a pagar</span>
              <span className="text-primary-dark">
                {formatoCLP(consumo.total_a_pagar)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
