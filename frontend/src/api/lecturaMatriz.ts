import { apiFetch } from "./http";
import type {
  LecturaMatriz,
  ComparativaAgua,
  LecturaMatrizUpdate,
  ComparativaAnual,
  ComparativaAguaResumen,
} from "../types";

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

  return apiFetch<LecturaMatriz>("/lectura-matriz/", {
    method: "POST",
    body: formData,
  });
}

export async function listarLecturasMatriz(): Promise<LecturaMatriz[]> {
  return apiFetch<LecturaMatriz[]>("/lectura-matriz/");
}

export async function obtenerFotoLecturaMatriz(id: number): Promise<string> {
  const data = await apiFetch<{ url: string }>(`/lectura-matriz/${id}/foto`);
  return data.url;
}

export async function obtenerComparativaAnual(
  anio: string,
): Promise<ComparativaAnual> {
  return apiFetch<ComparativaAnual>(
    `/lectura-matriz/comparativa-anual/${anio}`,
  );
}

export async function obtenerComparativaTotal(): Promise<ComparativaAguaResumen> {
  return apiFetch<ComparativaAguaResumen>("/lectura-matriz/comparativa-total");
}

export async function actualizarLecturaMatriz(
  id: number,
  data: LecturaMatrizUpdate,
): Promise<LecturaMatriz> {
  return apiFetch<LecturaMatriz>(`/lectura-matriz/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function obtenerComparativa(
  periodo: string,
): Promise<ComparativaAgua> {
  return apiFetch<ComparativaAgua>(`/lectura-matriz/comparativa/${periodo}`);
}

export async function obtenerComparativaHistorica(
  meses: number = 6,
): Promise<ComparativaAgua[]> {
  return apiFetch<ComparativaAgua[]>(
    `/lectura-matriz/comparativa-historica/?meses=${meses}`,
  );
}
