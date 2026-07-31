import type { LecturaInput, Lectura, LecturaUpdate } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function crearLectura(data: LecturaInput) {
  const res = await fetch(`${API_URL}/lecturas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al registrar lectura");
  }
  return res.json();
}

export async function obtenerHistorialLecturas(
  clienteId?: number,
): Promise<Lectura[]> {
  const url = clienteId
    ? `${API_URL}/lecturas/?cliente_id=${clienteId}`
    : `${API_URL}/lecturas/`;

  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || "Error al obtener el historial de lecturas",
    );
  }
  return res.json();
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
