import { apiFetch } from "./http";
import type {
  MedicionPresion,
  MedicionPresionCreate,
  MedicionPresionUpdate,
  HistorialEdicion,
} from "../types";

export async function crearMedicionPresion(
  datos: MedicionPresionCreate,
): Promise<MedicionPresion> {
  return apiFetch<MedicionPresion>("/presion/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function obtenerHistorialPresion(
  desde?: string,
  hasta?: string,
  limit?: number,
): Promise<MedicionPresion[]> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  if (limit) params.set("limit", String(limit));

  return apiFetch<MedicionPresion[]>(`/presion/?${params.toString()}`);
}

export async function obtenerMedicionPresion(
  id: number,
): Promise<MedicionPresion> {
  return apiFetch<MedicionPresion>(`/presion/${id}`);
}

export async function editarMedicionPresion(
  id: number,
  datos: MedicionPresionUpdate,
): Promise<MedicionPresion> {
  return apiFetch<MedicionPresion>(`/presion/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export async function obtenerHistorialEdicionesMedicion(
  id: number,
): Promise<HistorialEdicion[]> {
  return apiFetch<HistorialEdicion[]>(`/presion/${id}/historial`);
}
