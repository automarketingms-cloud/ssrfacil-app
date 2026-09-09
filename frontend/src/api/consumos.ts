import { apiFetch } from "./http";
import type { ConsumoResponse } from "../types";

export async function obtenerConsumo(
  clienteId: number,
  periodo: string,
): Promise<ConsumoResponse> {
  return apiFetch<ConsumoResponse>(`/consumos/${clienteId}/${periodo}`);
}

export async function obtenerResumenMensual(
  periodo: string,
): Promise<ConsumoResponse[]> {
  const params = new URLSearchParams({ periodo });
  return apiFetch<ConsumoResponse[]>(`/consumos/?${params.toString()}`);
}
