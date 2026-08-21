import type {
  LecturaMatriz,
  ComparativaAgua,
  LecturaMatrizUpdate,
  ComparativaAnual,
  ComparativaAguaResumen,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function crearLecturaMatriz(data: {
  periodo: string;
  fecha_lectura: string;
  lectura_actual: number;
  observaciones?: string;
  foto: File;
}): Promise<LecturaMatriz> {
  const formData = new FormData();
  formData.set("periodo", data.periodo);
  formData.set("fecha_lectura", data.fecha_lectura);
  formData.set("lectura_actual", String(data.lectura_actual));
  if (data.observaciones) {
    formData.set("observaciones", data.observaciones);
  }
  formData.set("foto", data.foto);

  const res = await fetch(`${API_URL}/lectura-matriz/`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al registrar la lectura matriz");
  }
  return res.json();
}

export async function listarLecturasMatriz(): Promise<LecturaMatriz[]> {
  const res = await fetch(`${API_URL}/lectura-matriz/`);
  if (!res.ok) throw new Error("Error al listar lecturas matriz");
  return res.json();
}

export async function obtenerFotoLecturaMatriz(id: number): Promise<string> {
  const res = await fetch(`${API_URL}/lectura-matriz/${id}/foto`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al obtener la foto");
  }
  const data = await res.json();
  return data.url;
}

export async function obtenerComparativaAnual(
  anio: string,
): Promise<ComparativaAnual> {
  const res = await fetch(
    `${API_URL}/lectura-matriz/comparativa-anual/${anio}`,
  );
  if (!res.ok) throw new Error("Error al obtener la comparativa anual");
  return res.json();
}

export async function obtenerComparativaTotal(): Promise<ComparativaAguaResumen> {
  const res = await fetch(`${API_URL}/lectura-matriz/comparativa-total`);
  if (!res.ok) throw new Error("Error al obtener la comparativa total");
  return res.json();
}

export async function actualizarLecturaMatriz(
  id: number,
  data: LecturaMatrizUpdate,
): Promise<LecturaMatriz> {
  const res = await fetch(`${API_URL}/lectura-matriz/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error al actualizar la lectura matriz");
  }
  return res.json();
}

export async function obtenerComparativa(
  periodo: string,
): Promise<ComparativaAgua> {
  const res = await fetch(`${API_URL}/lectura-matriz/comparativa/${periodo}`);
  if (!res.ok) throw new Error("Error al obtener la comparativa");
  return res.json();
}

export async function obtenerComparativaHistorica(
  meses: number = 6,
): Promise<ComparativaAgua[]> {
  const res = await fetch(
    `${API_URL}/lectura-matriz/comparativa-historica/?meses=${meses}`,
  );
  if (!res.ok) throw new Error("Error al obtener la comparativa histórica");
  return res.json();
}
