import { apiFetch } from "./http";
import type { Configuracion, ConfiguracionUpdate } from "../types";

export async function obtenerConfiguracion(): Promise<Configuracion> {
  return apiFetch<Configuracion>("/configuracion/");
}

export async function actualizarConfiguracion(
  datos: ConfiguracionUpdate,
): Promise<Configuracion> {
  return apiFetch<Configuracion>("/configuracion/", {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}
