import { apiFetch } from "./http";
import type { CafSii, AlertaFolio } from "../types";

export async function subirCaf(
  archivo: File,
): Promise<{
  mensaje: string;
  tipo_dte: string;
  folio_desde: number;
  folio_hasta: number;
}> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiFetch<{
    mensaje: string;
    tipo_dte: string;
    folio_desde: number;
    folio_hasta: number;
  }>("/caf/", {
    method: "POST",
    body: formData,
  });
}

export async function listarCafs(): Promise<CafSii[]> {
  return apiFetch<CafSii[]>("/caf/");
}

export async function obtenerAlertasFolios(): Promise<AlertaFolio[]> {
  return apiFetch<AlertaFolio[]>("/caf/alertas");
}
