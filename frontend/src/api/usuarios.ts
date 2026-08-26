import { apiFetch } from "./http";
import type { Usuario, UsuarioCreateData, UsuarioUpdateData } from "../types";

export async function listarUsuarios(empresaId?: number): Promise<Usuario[]> {
  const query = empresaId !== undefined ? `?empresa_id=${empresaId}` : "";
  return apiFetch<Usuario[]>(`/usuarios/${query}`);
}

export async function crearUsuario(data: UsuarioCreateData): Promise<Usuario> {
  return apiFetch<Usuario>("/usuarios/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarUsuario(
  id: number,
  data: UsuarioUpdateData,
): Promise<Usuario> {
  return apiFetch<Usuario>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cambiarMiPassword(
  password_actual: string,
  password_nueva: string,
): Promise<void> {
  await apiFetch<void>("/usuarios/me/password", {
    method: "PATCH",
    body: JSON.stringify({ password_actual, password_nueva }),
  });
}
