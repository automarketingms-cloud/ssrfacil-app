import { apiFetch } from "./http";
import type {
  FacturaPendiente,
  Pago,
  PagoCreate,
  HistorialPago,
  PagoDelDia,
} from "../types";

export async function obtenerFacturasPendientes(
  clienteId: number,
): Promise<FacturaPendiente[]> {
  return apiFetch(`/pagos/pendientes/${clienteId}`);
}

export async function obtenerPagosDelDia(
  fecha?: string,
): Promise<PagoDelDia[]> {
  const query = fecha ? `?fecha=${fecha}` : "";
  return apiFetch(`/pagos/dia${query}`);
}

export async function registrarPago(pago: PagoCreate): Promise<Pago> {
  return apiFetch(`/pagos/`, {
    method: "POST",
    body: JSON.stringify(pago),
  });
}

export async function obtenerHistorialPagos(
  clienteId: number,
): Promise<HistorialPago[]> {
  return apiFetch(`/pagos/historial/${clienteId}`);
}
