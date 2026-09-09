import { apiFetch } from "./http";
import type { EstadoLectura, RutaLectura } from "../types";

export async function obtenerRutaLectura(
  estado?: EstadoLectura,
): Promise<RutaLectura> {
  const params = estado ? `?estado=${estado}` : "";
  return apiFetch<RutaLectura>(`/lecturas/ruta${params}`);
}

async function descargarBlob(path: string, filename: string): Promise<void> {
  const blob = await apiFetch<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function descargarRutaLecturaExcel(): Promise<void> {
  return descargarBlob("/lecturas/ruta/excel", "ruta_lectura.xlsx");
}

export function descargarRutaLecturaPdf(): Promise<void> {
  return descargarBlob("/lecturas/ruta/pdf", "ruta_lectura.pdf");
}
