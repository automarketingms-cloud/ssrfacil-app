// src/api/auth.ts
import { apiFetch } from "./http";
import type { Usuario, LoginResponse } from "../types";

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    skipAuth: true,
  });
}

export async function obtenerPerfil(): Promise<Usuario> {
  return apiFetch<Usuario>("/usuarios/me");
}
