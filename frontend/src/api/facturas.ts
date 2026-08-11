import type { Factura, ResumenGeneracionFacturas } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function generarFacturasPeriodo(
  periodo: string,
): Promise<ResumenGeneracionFacturas> {
  const res = await fetch(`${API_URL}/facturas/generar/${periodo}`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al generar facturas");
  }
  return res.json();
}

export async function listarFacturas(filtros?: {
  periodo?: string;
  cliente_id?: number;
  estado?: string;
}): Promise<Factura[]> {
  const params = new URLSearchParams();
  if (filtros?.periodo) params.set("periodo", filtros.periodo);
  if (filtros?.cliente_id) params.set("cliente_id", String(filtros.cliente_id));
  if (filtros?.estado) params.set("estado", filtros.estado);

  const res = await fetch(`${API_URL}/facturas/?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al listar facturas");
  }
  return res.json();
}

export async function obtenerFactura(facturaId: number): Promise<Factura> {
  const res = await fetch(`${API_URL}/facturas/${facturaId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al obtener factura");
  }
  return res.json();
}

export function urlFacturaPdf(facturaId: number): string {
  return `${API_URL}/facturas/${facturaId}/pdf`;
}
