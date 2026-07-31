import type { MedicionPresion, MedicionPresionCreate } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function crearMedicionPresion(
  datos: MedicionPresionCreate,
): Promise<MedicionPresion> {
  const res = await fetch(`${API_URL}/presion/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al registrar la medición");
  }
  return res.json();
}

export async function obtenerHistorialPresion(
  desde?: string,
  hasta?: string,
): Promise<MedicionPresion[]> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  const res = await fetch(`${API_URL}/presion/?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || "Error al obtener el historial de presión",
    );
  }
  return res.json();
}
