import type { ConsumoResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerConsumo(
  clienteId: number,
  periodo: string,
): Promise<ConsumoResponse> {
  const res = await fetch(`${API_URL}/consumos/${clienteId}/${periodo}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al obtener consumo");
  }
  return res.json();
}
