import { apiFetch } from "./http";
import type { Tarifa } from "../types";

export async function crearTarifa(data: Omit<Tarifa, "id">): Promise<Tarifa> {
  return apiFetch<Tarifa>("/tarifas/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listarTarifas(): Promise<Tarifa[]> {
  return apiFetch<Tarifa[]>("/tarifas/");
}

export async function obtenerTarifaVigente(): Promise<Tarifa> {
  return apiFetch<Tarifa>("/tarifas/vigente");
}

export async function obtenerTarifa(id: number): Promise<Tarifa> {
  return apiFetch<Tarifa>(`/tarifas/${id}`);
}

export async function eliminarTarifa(id: number): Promise<void> {
  await apiFetch<void>(`/tarifas/${id}`, {
    method: "DELETE",
  });
}
