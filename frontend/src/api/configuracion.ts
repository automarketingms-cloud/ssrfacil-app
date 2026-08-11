import type { Configuracion, ConfiguracionUpdate } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const res = await fetch(`${API_URL}/configuracion/`);
  if (!res.ok) {
    throw new Error("No se pudo obtener la configuración");
  }
  return res.json();
}

export async function actualizarConfiguracion(
  datos: ConfiguracionUpdate,
): Promise<Configuracion> {
  const res = await fetch(`${API_URL}/configuracion/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "No se pudo actualizar la configuración");
  }
  return res.json();
}
