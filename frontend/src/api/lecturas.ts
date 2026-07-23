import type { LecturaInput } from "../types";

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
