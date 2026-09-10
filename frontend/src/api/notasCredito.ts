import { apiFetch } from "./http";
import type { NotaCredito, AnularFacturaData } from "../types";

export async function anularFactura(
  facturaId: number,
  data: AnularFacturaData,
): Promise<NotaCredito> {
  return apiFetch<NotaCredito>(`/notas-credito/anular/${facturaId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listarNotasCredito(): Promise<NotaCredito[]> {
  return apiFetch<NotaCredito[]>("/notas-credito/");
}

export async function obtenerNotaCredito(id: number): Promise<NotaCredito> {
  return apiFetch<NotaCredito>(`/notas-credito/${id}`);
}
