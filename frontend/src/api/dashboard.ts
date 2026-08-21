const API_URL = import.meta.env.VITE_API_URL;

import type { ResumenDashboard } from "../types";

export async function obtenerResumenDashboard(
  periodo: string,
): Promise<ResumenDashboard> {
  const res = await fetch(`${API_URL}/dashboard/resumen?periodo=${periodo}`);
  if (!res.ok) {
    throw new Error("No se pudo obtener el resumen del dashboard");
  }
  return res.json();
}
