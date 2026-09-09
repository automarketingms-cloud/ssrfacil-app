import { useState, useEffect } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { listarClientes } from "../api/clientes";
import { useAuth } from "../context/AuthContext";
import {
  obtenerFacturasPendientes,
  registrarPago,
  obtenerHistorialPagos,
  obtenerPagosDelDia,
} from "../api/pagos";
import type {
  Cliente,
  FacturaPendiente,
  HistorialPago,
  PagoDelDia,
} from "../types";

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

// Redondeo a la unidad de peso (CLP no tiene decimales) — mismo criterio
// que usa el label "Saldo pendiente" en pantalla.
function redondearAPeso(monto: number): number {
  return Math.round(monto);
}

// Ley N° 20.956 (Regla del Redondeo): solo aplica a pagos en efectivo,
// y se aplica sobre el monto ya redondeado a peso. Terminaciones 1-5
// bajan a la decena inferior, 6-9 suben a la superior.
function redondearSegunLey(monto: number, metodoPago: string): number {
  const enteroPeso = redondearAPeso(monto);
  if (metodoPago !== "efectivo") {
    return enteroPeso;
  }
  const resto = enteroPeso % 10;
  if (resto === 0) return enteroPeso;
  return resto <= 5 ? enteroPeso - resto : enteroPeso + (10 - resto);
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
  const [referencia, setReferencia] = useState("");

  const requiereReferencia = [
    "tarjeta_debito",
    "tarjeta_credito",
    "transferencia",
  ].includes(metodoPago);
  const labelReferencia =
    metodoPago === "transferencia" ? "N° de transacción" : "N° de voucher";

  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [pagosDelDia, setPagosDelDia] = useState<PagoDelDia[]>([]);
  const [loadingPagosDelDia, setLoadingPagosDelDia] = useState(false);

  const [historial, setHistorial] = useState<HistorialPago[]>([]);

  const { usuario } = useAuth();
  const [filtroCajero, setFiltroCajero] = useState<"todos" | "mios">("todos");

  // Máximo permitido para el monto según el método de pago actual.
  const montoMaximo = facturaSeleccionada
    ? redondearSegunLey(facturaSeleccionada.saldo, metodoPago)
    : 0;

  async function cargarPagosDelDia() {
    setLoadingPagosDelDia(true);
    try {
      const data = await obtenerPagosDelDia();
      setPagosDelDia(data);
    } catch {
      // no bloqueamos la página si falla esto
    } finally {
      setLoadingPagosDelDia(false);
    }
  }

  useEffect(() => {
    cargarPagosDelDia();
  }, []);

  async function handleBuscar(valor: string) {
    setBusqueda(valor);
    setClienteSeleccionado(null);
    setFacturas([]);
    setFacturaSeleccionada(null);
    if (valor.trim().length < 2) {
      setClientes([]);
      return;
    }
    const data = await listarClientes({ activo: true, limit: 1000 });
    const filtrados = data.items.filter(
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
    setMonto(String(redondearSegunLey(factura.saldo, metodoPago)));
    setExito(null);
    setError(null);
  }

  function handleCambiarMetodoPago(nuevoMetodo: string) {
    setMetodoPago(nuevoMetodo);
    setReferencia("");
    // Si el monto actual coincidía con el máximo anterior (pago total),
    // lo recalculamos para el nuevo método; si el usuario ya editó un
    // monto parcial, lo dejamos como está.
    if (facturaSeleccionada) {
      const maximoAnterior = redondearSegunLey(
        facturaSeleccionada.saldo,
        metodoPago,
      );
      if (Number(monto) === maximoAnterior) {
        setMonto(
          String(redondearSegunLey(facturaSeleccionada.saldo, nuevoMetodo)),
        );
      }
    }
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
        referencia: requiereReferencia ? referencia : undefined,
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
      setReferencia("");
      cargarPagosDelDia();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {metodoPago === "efectivo" && (
                <p className="text-xs text-muted -mt-2">
                  Monto en efectivo redondeado a la decena según Ley N° 20.956:{" "}
                  <span className="font-medium text-text">
                    {formatearMonto(montoMaximo)}
                  </span>
                </p>
              )}

              <label className="text-xs text-muted">Monto a pagar</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                max={montoMaximo}
                min={metodoPago === "efectivo" ? 0 : 1}
                step={metodoPago === "efectivo" ? 10 : 1}
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
                onChange={(e) => handleCambiarMetodoPago(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_debito">Tarjeta débito</option>
                <option value="tarjeta_credito">Tarjeta crédito</option>
                <option value="transferencia">Transferencia</option>
              </select>

              {requiereReferencia && (
                <>
                  <label className="text-xs text-muted">
                    {labelReferencia}
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    required
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-surface"
                  />
                </>
              )}

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
                      <span className="capitalize">
                        {h.metodo_pago.replace("_", " ")}
                        {h.referencia ? ` · ${h.referencia}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!clienteSeleccionado && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text">Pagos de hoy</h2>
            <div className="flex text-xs rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setFiltroCajero("todos")}
                className={`px-3 py-1 font-medium transition-colors ${
                  filtroCajero === "todos"
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:bg-bg"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroCajero("mios")}
                className={`px-3 py-1 font-medium transition-colors ${
                  filtroCajero === "mios"
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:bg-bg"
                }`}
              >
                Solo míos
              </button>
            </div>
          </div>
          {loadingPagosDelDia ? (
            <p className="text-sm text-muted">Cargando...</p>
          ) : (
            (() => {
              const pagosFiltrados =
                filtroCajero === "mios"
                  ? pagosDelDia.filter((p) => p.cajero_id === usuario?.id)
                  : pagosDelDia;

              if (pagosFiltrados.length === 0) {
                return (
                  <p className="text-sm text-muted">
                    {filtroCajero === "mios"
                      ? "Aún no has registrado pagos hoy."
                      : "Aún no se han registrado pagos hoy."}
                  </p>
                );
              }

              return (
                <ul className="flex flex-col gap-2">
                  {pagosFiltrados.map((p) => (
                    <li
                      key={p.pago_id}
                      className="border border-border rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-text">
                          {p.cliente_nombre}
                        </span>
                        <span className="font-semibold text-text">
                          {formatearMonto(p.monto)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-muted">
                        <span>
                          Período {p.periodo} · Cajero: {p.cajero_nombre}
                        </span>
                        <span className="capitalize">
                          {p.metodo_pago.replace("_", " ")}
                          {p.referencia ? ` · ${p.referencia}` : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
