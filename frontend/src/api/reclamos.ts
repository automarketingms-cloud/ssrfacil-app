// api/reclamos.ts
const API_URL = import.meta.env.VITE_API_URL; // ajusta según cómo lo tengas definido

export interface Reclamo {
  id: number;
  folio: string;
  anio: number;
  cliente_id: number | null;
  nombre_reclamante: string | null;
  rut_reclamante: string | null;
  direccion_reclamo: string | null;
  tipo_reclamo: string;
  descripcion: string;
  fecha_recepcion: string;
  plazo_vencimiento: string;
  estado: "abierto" | "respondido" | "cerrado" | "cerrado_sin_respuesta";
  fecha_respuesta: string | null;
  respuesta: string | null;
  dias_habiles_respuesta: number | null;
  fuera_de_plazo: boolean | null;
  motivo_cierre: string | null;
  observaciones: string | null;
}

export interface ReclamoCreate {
  cliente_id?: number | null;
  nombre_reclamante?: string;
  rut_reclamante?: string;
  direccion_reclamo?: string;
  tipo_reclamo: string;
  descripcion: string;
  fecha_recepcion?: string;
  observaciones?: string;
}

async function manejarRespuesta(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Error en la solicitud");
  }
  return res.json();
}

export async function crearReclamo(datos: ReclamoCreate): Promise<Reclamo> {
  const res = await fetch(`${API_URL}/reclamos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(res);
}

export async function listarReclamos(filtros?: {
  periodo?: string;
  estado?: string;
  cliente_id?: number;
}): Promise<Reclamo[]> {
  const params = new URLSearchParams();
  if (filtros?.periodo) params.append("periodo", filtros.periodo);
  if (filtros?.estado) params.append("estado", filtros.estado);
  if (filtros?.cliente_id)
    params.append("cliente_id", String(filtros.cliente_id));

  const res = await fetch(`${API_URL}/reclamos/?${params.toString()}`);
  return manejarRespuesta(res);
}

export async function obtenerReclamo(id: number): Promise<Reclamo> {
  const res = await fetch(`${API_URL}/reclamos/${id}`);
  return manejarRespuesta(res);
}

export async function responderReclamo(
  id: number,
  respuesta: string,
): Promise<Reclamo> {
  const res = await fetch(`${API_URL}/reclamos/${id}/responder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ respuesta }),
  });
  return manejarRespuesta(res);
}

export async function cerrarReclamo(id: number): Promise<Reclamo> {
  const res = await fetch(`${API_URL}/reclamos/${id}/cerrar`, {
    method: "PATCH",
  });
  return manejarRespuesta(res);
}

export async function cerrarReclamoSinRespuesta(
  id: number,
  motivo: string,
): Promise<Reclamo> {
  const res = await fetch(`${API_URL}/reclamos/${id}/cerrar-sin-respuesta`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo }),
  });
  return manejarRespuesta(res);
}
