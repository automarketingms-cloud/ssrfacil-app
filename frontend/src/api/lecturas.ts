import type { Lectura, LecturaUpdate, LecturaListResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

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

  const res = await fetch(`${API_URL}/lecturas/`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al registrar lectura");
  }
  return res.json();
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

  const res = await fetch(`${API_URL}/lecturas/?${query.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || "Error al obtener el historial de lecturas",
    );
  }
  return res.json();
}

export async function obtenerFotoLectura(lecturaId: number): Promise<string> {
  const res = await fetch(`${API_URL}/lecturas/${lecturaId}/foto`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al obtener la foto");
  }
  const data = await res.json();
  return data.url;
}

export async function editarLectura(
  lecturaId: number,
  datos: LecturaUpdate,
): Promise<Lectura> {
  const res = await fetch(`${API_URL}/lecturas/${lecturaId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al editar la lectura");
  }
  return res.json();
}

export async function crearLecturaTerminoMedio(data: {
  cliente_id: number;
  periodo: string;
  fecha_lectura: string;
}): Promise<Lectura> {
  const res = await fetch(`${API_URL}/lecturas/termino-medio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    const detail = error?.detail;
    const mensaje = Array.isArray(detail)
      ? detail.map((d) => d.msg || JSON.stringify(d)).join(" | ")
      : detail || "Error al registrar lectura por término medio";
    throw new Error(mensaje);
  }
  return res.json();
}
