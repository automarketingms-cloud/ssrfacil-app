import { apiFetch } from "./http";
import type { ResumenDashboard } from "../types";

export async function obtenerResumenDashboard(
  periodo: string,
): Promise<ResumenDashboard> {
  return apiFetch<ResumenDashboard>(`/dashboard/resumen?periodo=${periodo}`);
}
