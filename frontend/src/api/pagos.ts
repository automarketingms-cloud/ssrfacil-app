import type { FacturaPendiente, Pago, PagoCreate } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerFacturasPendientes(
  clienteId: number,
): Promise<FacturaPendiente[]> {
  const res = await fetch(`${API_URL}/pagos/pendientes/${clienteId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al obtener facturas pendientes");
  }
  return res.json();
}

export async function registrarPago(pago: PagoCreate): Promise<Pago> {
  const res = await fetch(`${API_URL}/pagos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pago),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al registrar el pago");
  }
  return res.json();
}

export async function obtenerHistorialPagos(
  clienteId: number,
): Promise<HistorialPago[]> {
  const res = await fetch(`${API_URL}/pagos/historial/${clienteId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al obtener historial de pagos");
  }
  return res.json();
}
