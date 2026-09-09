import { apiFetch } from "./http";
import type { CorteResponse, CorteCierre, CorteCreate } from "../types";

export async function abrirCorte(data: CorteCreate): Promise<CorteResponse> {
  return apiFetch<CorteResponse>("/continuidad/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function cerrarCorte(
  corteId: number,
  data: CorteCierre,
): Promise<CorteResponse> {
  return apiFetch<CorteResponse>(`/continuidad/${corteId}/cerrar`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function listarCortes(params?: {
  periodo?: string;
  solo_abiertos?: boolean;
}): Promise<CorteResponse[]> {
  const query = new URLSearchParams();
  if (params?.periodo) query.append("periodo", params.periodo);
  if (params?.solo_abiertos) query.append("solo_abiertos", "true");

  return apiFetch<CorteResponse[]>(`/continuidad/?${query.toString()}`);
}

export async function obtenerCorte(corteId: number): Promise<CorteResponse> {
  return apiFetch<CorteResponse>(`/continuidad/${corteId}`);
}
