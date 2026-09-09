import { apiFetch } from "./http";
import type { Cliente, ClienteListResponse } from "../types";

export async function crearCliente(
  data: Omit<Cliente, "id">,
): Promise<Cliente> {
  return apiFetch<Cliente>("/clientes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listarClientes(filtros?: {
  activo?: boolean;
  es_socio?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<ClienteListResponse> {
  const params = new URLSearchParams();
  if (filtros?.activo !== undefined) {
    params.set("activo", String(filtros.activo));
  }
  if (filtros?.es_socio !== undefined) {
    params.set("es_socio", String(filtros.es_socio));
  }
  if (filtros?.q) {
    params.set("q", filtros.q);
  }
  params.set("page", String(filtros?.page ?? 1));
  params.set("limit", String(filtros?.limit ?? 20));
  const query = `?${params.toString()}`;
  return apiFetch<ClienteListResponse>(`/clientes/${query}`);
}

export async function buscarClientePorRut(rut: string): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/buscar/${rut}`);
}

export async function obtenerCliente(id: number): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/${id}`);
}

export async function actualizarCliente(
  id: number,
  data: Partial<Omit<Cliente, "id">>,
): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function desactivarCliente(id: number): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/${id}/desactivar`, {
    method: "PATCH",
  });
}

export async function reactivarCliente(id: number): Promise<Cliente> {
  return apiFetch<Cliente>(`/clientes/${id}/reactivar`, {
    method: "PATCH",
  });
}
