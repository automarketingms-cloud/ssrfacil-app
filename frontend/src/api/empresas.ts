import { apiFetch } from "./http";
import type { Empresa, EmpresaCreateData } from "../types";

export async function listarEmpresas(): Promise<Empresa[]> {
  return apiFetch<Empresa[]>("/empresas/");
}

export async function crearEmpresa(data: EmpresaCreateData): Promise<Empresa> {
  return apiFetch<Empresa>("/empresas/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
