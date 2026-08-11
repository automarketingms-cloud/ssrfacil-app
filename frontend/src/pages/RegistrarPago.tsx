import { useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { listarClientes } from "../api/clientes";
import {
  obtenerFacturasPendientes,
  registrarPago,
  obtenerHistorialPagos,
} from "../api/pagos";
import type { Cliente, FacturaPendiente } from "../types";

function formatearMonto(valor: number): string {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function hoyISO(): string {
  return new Date().toISOString().split("T")[0];
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  parcial: "bg-primary-light text-primary-dark",
  vencida: "bg-danger-soft text-danger",
};

export default function RegistrarPago() {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState<FacturaPendiente | null>(null);

  const [monto, setMonto] = useState("");
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [observaciones, setObservaciones] = useState("");

  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [historial, setHistorial] = useState<HistorialPago[]>([]);

  async function handleBuscar(valor: string) {
    setBusqueda(valor);
    setClienteSeleccionado(null);
    setFacturas([]);
    setFacturaSeleccionada(null);
    if (valor.trim().length < 2) {
      setClientes([]);
      return;
    }
    const data = await listarClientes({ activo: true });
    const filtrados = data.filter(
      (c) =>
        c.nombre.toLowerCase().includes(valor.toLowerCase()) ||
        c.rut.toLowerCase().includes(valor.toLowerCase()),
    );
    setClientes(filtrados);
  }

  async function handleSeleccionarCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    setBusqueda(cliente.nombre);
    setClientes([]);
    setFacturaSeleccionada(null);
    setExito(null);
    setError(null);
    setLoadingFacturas(true);
    try {
      const data = await obtenerFacturasPendientes(cliente.id);
      setFacturas(data);

      const historialData = await obtenerHistorialPagos(cliente.id);
      setHistorial(historialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar boletas");
    } finally {
      setLoadingFacturas(false);
    }
  }

  function handleSeleccionarFactura(factura: FacturaPendiente) {
    setFacturaSeleccionada(factura);
    setMonto(String(factura.saldo));
    setExito(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facturaSeleccionada) return;
    setError(null);
    setExito(null);
    setEnviando(true);
    try {
      await registrarPago({
        factura_id: facturaSeleccionada.factura_id,
        monto: Number(monto),
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        observaciones: observaciones || undefined,
      });
      setExito(
        `Pago de ${formatearMonto(Number(monto))} registrado en el período ${facturaSeleccionada.periodo}`,
      );
      // refrescar boletas pendientes del cliente
      if (clienteSeleccionado) {
        const data = await obtenerFacturasPendientes(clienteSeleccionado.id);
        setFacturas(data);
      }
      setFacturaSeleccionada(null);
      setMonto("");
      setObservaciones("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar el pago",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Registrar Pago</h1>
        <p className="text-sm text-muted">
          Busca al cliente y selecciona la boleta a abonar
        </p>
      </div>

      {/* Buscador de cliente */}
      <div className="relative mb-6 max-w-md">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => handleBuscar(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
        {clientes.length > 0 && (
          <ul className="absolute z-10 w-full bg-surface border border-border rounded-lg mt-1 shadow-lg max-h-56 overflow-y-auto">
            {clientes.map((c) => (
              <li
                key={c.id}
                onClick={() => handleSeleccionarCliente(c)}
                className="px-3 py-2 text-sm hover:bg-primary-light/40 cursor-pointer"
              >
                {c.nombre} — {c.rut}
              </li>
            ))}
          </ul>
        )}
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

      {clienteSeleccionado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Boletas pendientes */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-text mb-3">
              Boletas pendientes de {clienteSeleccionado.nombre}
            </h2>
            {loadingFacturas ? (
              <p className="text-sm text-muted">Cargando...</p>
            ) : facturas.length === 0 ? (
              <p className="text-sm text-muted">
                Este cliente no tiene boletas pendientes.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {facturas.map((f) => (
                  <li
                    key={f.factura_id}
                    onClick={() => handleSeleccionarFactura(f)}
                    className={`border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      facturaSeleccionada?.factura_id === f.factura_id
                        ? "border-primary bg-primary-light/40"
                        : "border-border hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">
                        Período {f.periodo}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[f.estado]}`}
                      >
                        {f.estado}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted">
                      <span>Vence: {f.fecha_vencimiento}</span>
                      <span className="font-semibold text-text">
                        Saldo: {formatearMonto(f.saldo)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Formulario de pago */}
          {facturaSeleccionada && (
            <form
              onSubmit={handleSubmit}
              className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 h-fit"
            >
              <h2 className="text-sm font-semibold text-text">
                Pagar período {facturaSeleccionada.periodo}
              </h2>
              <p className="text-xs text-muted">
                Saldo pendiente: {formatearMonto(facturaSeleccionada.saldo)}
              </p>

              <label className="text-xs text-muted">Monto a pagar</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                max={facturaSeleccionada.saldo}
                min={1}
                step="1"
                required
                className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              />

              <label className="text-xs text-muted">Fecha de pago</label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                required
                className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              />

              <label className="text-xs text-muted">Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>

              <label className="text-xs text-muted">
                Observaciones (opcional)
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
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
                  <DollarSign size={16} />
                )}
                Registrar Pago
              </button>
            </form>
          )}

          {/* Historial de pagos */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-text mb-3">
              Historial de pagos
            </h2>
            {historial.length === 0 ? (
              <p className="text-sm text-muted">Sin pagos registrados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {historial.map((h) => (
                  <li
                    key={h.pago_id}
                    className="border border-border rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text">
                        Período {h.periodo}
                      </span>
                      <span className="font-semibold text-text">
                        {formatearMonto(h.monto)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted">
                      <span>{h.fecha_pago}</span>
                      <span className="capitalize">{h.metodo_pago}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
