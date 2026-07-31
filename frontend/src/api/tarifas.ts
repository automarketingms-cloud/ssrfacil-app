import type { Tarifa } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function crearTarifa(data: Omit<Tarifa, "id">): Promise<Tarifa> {
  const res = await fetch(`${API_URL}/tarifas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al crear tarifa");
  }
  return res.json();
}

export async function listarTarifas(): Promise<Tarifa[]> {
  const res = await fetch(`${API_URL}/tarifas/`);
  if (!res.ok) throw new Error("Error al obtener tarifas");
  return res.json();
}

export async function obtenerTarifaVigente(): Promise<Tarifa> {
  const res = await fetch(`${API_URL}/tarifas/vigente`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "No hay tarifa vigente");
  }
  return res.json();
}

export async function obtenerTarifa(id: number): Promise<Tarifa> {
  const res = await fetch(`${API_URL}/tarifas/${id}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Tarifa no encontrada");
  }
  return res.json();
}

export async function eliminarTarifa(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/tarifas/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al eliminar tarifa");
  }
}
