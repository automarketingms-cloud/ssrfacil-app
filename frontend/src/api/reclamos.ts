import { apiFetch } from "./http";
import type { ReclamoCreate, Reclamo } from "../types";

export async function crearReclamo(datos: ReclamoCreate): Promise<Reclamo> {
  return apiFetch<Reclamo>("/reclamos/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function listarReclamos(filtros?: {
  periodo?: string;
  estado?: string;
  cliente_id?: number;
}): Promise<Reclamo[]> {
  const params = new URLSearchParams();
  if (filtros?.periodo) params.append("periodo", filtros.periodo);
  if (filtros?.estado) params.append("estado", filtros.estado);
  if (filtros?.cliente_id)
    params.append("cliente_id", String(filtros.cliente_id));

  return apiFetch<Reclamo[]>(`/reclamos/?${params.toString()}`);
}

export async function obtenerReclamo(id: number): Promise<Reclamo> {
  return apiFetch<Reclamo>(`/reclamos/${id}`);
}

export async function responderReclamo(
  id: number,
  respuesta: string,
): Promise<Reclamo> {
  return apiFetch<Reclamo>(`/reclamos/${id}/responder`, {
    method: "PATCH",
    body: JSON.stringify({ respuesta }),
  });
}

export async function cerrarReclamo(id: number): Promise<Reclamo> {
  return apiFetch<Reclamo>(`/reclamos/${id}/cerrar`, {
    method: "PATCH",
  });
}

export async function cerrarReclamoSinRespuesta(
  id: number,
  motivo: string,
): Promise<Reclamo> {
  return apiFetch<Reclamo>(`/reclamos/${id}/cerrar-sin-respuesta`, {
    method: "PATCH",
    body: JSON.stringify({ motivo }),
  });
}
