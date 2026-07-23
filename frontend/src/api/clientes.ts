import type { Cliente } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function crearCliente(
  data: Omit<Cliente, "id">,
): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al crear cliente");
  }
  return res.json();
}

export async function listarClientes(filtros?: {
  activo?: boolean;
  es_socio?: boolean;
}): Promise<Cliente[]> {
  const params = new URLSearchParams();
  if (filtros?.activo !== undefined) {
    params.set("activo", String(filtros.activo));
  }
  if (filtros?.es_socio !== undefined) {
    params.set("es_socio", String(filtros.es_socio));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/clientes/${query}`);
  if (!res.ok) throw new Error("Error al obtener clientes");
  return res.json();
}

export async function buscarClientePorRut(rut: string): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/buscar/${rut}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Cliente no encontrado");
  }
  return res.json();
}

export async function actualizarCliente(
  id: number,
  data: Partial<Omit<Cliente, "id">>,
): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al actualizar cliente");
  }
  return res.json();
}

export async function desactivarCliente(id: number): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar cliente");
  return res.json();
}

export async function reactivarCliente(id: number): Promise<Cliente> {
  const res = await fetch(`${API_URL}/clientes/${id}/reactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al reactivar cliente");
  return res.json();
}
