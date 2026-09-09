import { apiFetch } from "./http";
import type { MedicionPresion, MedicionPresionCreate } from "../types";

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
): Promise<MedicionPresion[]> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  return apiFetch<MedicionPresion[]>(`/presion/?${params.toString()}`);
}
