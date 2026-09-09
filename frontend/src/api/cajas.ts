import { apiFetch } from "./http";
import type {
  Caja,
  CajaAperturaCreate,
  CajaCierreCreate,
  CajaArqueoCreate,
  CajaResumen,
  DetalleCaja,
  CajaConCajero,
} from "../types";

export async function abrirCaja(datos: CajaAperturaCreate): Promise<Caja> {
  return apiFetch(`/cajas/abrir`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function obtenerDetalleCaja(cajaId: number): Promise<DetalleCaja> {
  return apiFetch(`/cajas/${cajaId}/detalle`);
}

export async function obtenerCajaAbierta(): Promise<Caja | null> {
  return apiFetch(`/cajas/abierta`);
}

export async function cerrarCaja(
  cajaId: number,
  datos: CajaCierreCreate,
): Promise<Caja> {
  return apiFetch(`/cajas/${cajaId}/cerrar`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function arquearCaja(
  cajaId: number,
  datos: CajaArqueoCreate,
): Promise<Caja> {
  return apiFetch(`/cajas/${cajaId}/arqueo`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function obtenerPdfArqueo(cajaId: number): Promise<Blob> {
  return apiFetch<Blob>(`/cajas/${cajaId}/arqueo/pdf`, {
    responseType: "blob",
  });
}

export async function obtenerHistorialCajas(): Promise<Caja[]> {
  return apiFetch(`/cajas/historial`);
}

export async function obtenerResumenCaja(cajaId: number): Promise<CajaResumen> {
  return apiFetch(`/cajas/${cajaId}/resumen`);
}

export async function obtenerCajasEmpresa(
  estado?: string,
): Promise<CajaConCajero[]> {
  const query = estado ? `?estado=${estado}` : "";
  return apiFetch(`/cajas/empresa${query}`);
}
