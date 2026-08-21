const API_URL = import.meta.env.VITE_API_URL;

import type { CorteResponse, CorteCierre, CorteCreate } from "../types";

export async function abrirCorte(data: CorteCreate): Promise<CorteResponse> {
  const res = await fetch(`${API_URL}/continuidad/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al abrir el corte");
  }
  return res.json();
}

export async function cerrarCorte(
  corteId: number,
  data: CorteCierre,
): Promise<CorteResponse> {
  const res = await fetch(`${API_URL}/continuidad/${corteId}/cerrar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al cerrar el corte");
  }
  return res.json();
}

export async function listarCortes(params?: {
  periodo?: string;
  solo_abiertos?: boolean;
}): Promise<CorteResponse[]> {
  const query = new URLSearchParams();
  if (params?.periodo) query.append("periodo", params.periodo);
  if (params?.solo_abiertos) query.append("solo_abiertos", "true");

  const res = await fetch(`${API_URL}/continuidad/?${query.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al listar cortes");
  }
  return res.json();
}

export async function obtenerCorte(corteId: number): Promise<CorteResponse> {
  const res = await fetch(`${API_URL}/continuidad/${corteId}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al obtener el corte");
  }
  return res.json();
}
