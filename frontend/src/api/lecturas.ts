import { apiFetch } from "./http";
import type { Lectura, LecturaUpdate, LecturaListResponse } from "../types";

export async function crearLectura(data: {
  cliente_id: number;
  fecha_lectura: string;
  periodo: string;
  lectura_actual: number;
  foto: File;
}): Promise<Lectura> {
  const formData = new FormData();
  formData.set("cliente_id", String(data.cliente_id));
  formData.set("fecha_lectura", data.fecha_lectura);
  formData.set("periodo", data.periodo);
  formData.set("lectura_actual", String(data.lectura_actual));
  formData.set("foto", data.foto);

  return apiFetch<Lectura>("/lecturas/", {
    method: "POST",
    body: formData,
  });
}

export async function obtenerHistorialLecturas(params?: {
  clienteId?: number;
  periodo?: string;
  anio?: string;
  page?: number;
  limit?: number;
}): Promise<LecturaListResponse> {
  const query = new URLSearchParams();
  if (params?.clienteId !== undefined) {
    query.set("cliente_id", String(params.clienteId));
  }
  if (params?.periodo) {
    query.set("periodo", params.periodo);
  } else if (params?.anio) {
    query.set("anio", params.anio);
  }
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 20));

  return apiFetch<LecturaListResponse>(`/lecturas/?${query.toString()}`);
}

export async function obtenerFotoLectura(lecturaId: number): Promise<string> {
  const data = await apiFetch<{ url: string }>(`/lecturas/${lecturaId}/foto`);
  return data.url;
}

export async function editarLectura(
  lecturaId: number,
  datos: LecturaUpdate,
): Promise<Lectura> {
  return apiFetch<Lectura>(`/lecturas/${lecturaId}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export async function crearLecturaTerminoMedio(data: {
  cliente_id: number;
  periodo: string;
  fecha_lectura: string;
}): Promise<Lectura> {
  return apiFetch<Lectura>("/lecturas/termino-medio", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
