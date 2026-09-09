import { apiFetch } from "./http";
import type { Factura, ResumenGeneracionFacturas } from "../types";

export async function generarFacturasPeriodo(
  periodo: string,
): Promise<ResumenGeneracionFacturas> {
  return apiFetch<ResumenGeneracionFacturas>(`/facturas/generar/${periodo}`, {
    method: "POST",
  });
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

  return apiFetch<Factura[]>(`/facturas/?${params.toString()}`);
}

export async function obtenerFactura(facturaId: number): Promise<Factura> {
  return apiFetch<Factura>(`/facturas/${facturaId}`);
}

export async function enviarFacturaSii(
  id: number,
): Promise<{ mensaje: string; folio: string; respuesta_sii: unknown }> {
  return apiFetch<{ mensaje: string; folio: string; respuesta_sii: unknown }>(
    `/facturas/${id}/enviar-sii`,
    { method: "POST" },
  );
}

export async function descargarFacturaPdf(facturaId: number): Promise<void> {
  const blob = await apiFetch<Blob>(`/facturas/${facturaId}/pdf`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `factura_${facturaId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
