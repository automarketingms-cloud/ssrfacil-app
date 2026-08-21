import type { EstadoLectura, RutaLectura } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerRutaLectura(
  estado?: EstadoLectura,
): Promise<RutaLectura> {
  const params = estado ? `?estado=${estado}` : "";
  const res = await fetch(`${API_URL}/lecturas/ruta${params}`);
  if (!res.ok) {
    throw new Error("No se pudo obtener la ruta de lectura");
  }
  return res.json();
}

export function urlRutaLecturaExcel(): string {
  return `${API_URL}/lecturas/ruta/excel`;
}

export function urlRutaLecturaPdf(): string {
  return `${API_URL}/lecturas/ruta/pdf`;
}
