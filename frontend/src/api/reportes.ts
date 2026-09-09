import { apiFetch } from "./http";
import type {
  ReporteFacturacionResponse,
  ReporteContinuidad,
  ReporteReclamos,
  ClienteSubsidio,
  ReportePagos,
} from "../types";

export async function obtenerReporteFacturacion(
  periodo: string,
): Promise<ReporteFacturacionResponse> {
  return apiFetch<ReporteFacturacionResponse>(
    `/reportes/facturacion/${periodo}`,
  );
}

async function descargarBlob(path: string, filename: string): Promise<void> {
  const blob = await apiFetch<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function descargarReporteFacturacionExcel(
  periodo: string,
): Promise<void> {
  return descargarBlob(
    `/reportes/facturacion/${periodo}/excel`,
    `reporte_facturacion_${periodo}.xlsx`,
  );
}

export function descargarReporteFacturacionPdf(periodo: string): Promise<void> {
  return descargarBlob(
    `/reportes/facturacion/${periodo}/pdf`,
    `reporte_facturacion_${periodo}.pdf`,
  );
}

export function descargarReportePresionExcel(
  desde?: string,
  hasta?: string,
): Promise<void> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  return descargarBlob(
    `/reportes/presion/excel?${params.toString()}`,
    "reporte_presion.xlsx",
  );
}

export function descargarReportePresionPdf(
  desde?: string,
  hasta?: string,
): Promise<void> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  return descargarBlob(
    `/reportes/presion/pdf?${params.toString()}`,
    "reporte_presion.pdf",
  );
}

export async function obtenerReporteContinuidad(
  periodo: string,
): Promise<ReporteContinuidad> {
  return apiFetch<ReporteContinuidad>(`/reportes/continuidad/${periodo}`);
}

export function descargarReporteContinuidadExcel(
  periodo: string,
): Promise<void> {
  return descargarBlob(
    `/reportes/continuidad/${periodo}/excel`,
    `reporte_continuidad_${periodo}.xlsx`,
  );
}

export function descargarReporteContinuidadPdf(periodo: string): Promise<void> {
  return descargarBlob(
    `/reportes/continuidad/${periodo}/pdf`,
    `reporte_continuidad_${periodo}.pdf`,
  );
}

export async function obtenerReporteReclamos(
  periodo: string,
): Promise<ReporteReclamos> {
  return apiFetch<ReporteReclamos>(`/reportes/reclamos/${periodo}`);
}

export function descargarReporteReclamosExcel(periodo: string): Promise<void> {
  return descargarBlob(
    `/reportes/reclamos/${periodo}/excel`,
    `reporte_reclamos_${periodo}.xlsx`,
  );
}

export function descargarReporteReclamosPdf(periodo: string): Promise<void> {
  return descargarBlob(
    `/reportes/reclamos/${periodo}/pdf`,
    `reporte_reclamos_${periodo}.pdf`,
  );
}

export async function obtenerReporteClientesSubsidio(
  soloActivos: boolean = true,
): Promise<ClienteSubsidio[]> {
  return apiFetch<ClienteSubsidio[]>(
    `/reportes/clientes-subsidio?solo_activos=${soloActivos}`,
  );
}

export async function descargarReporteClientesSubsidioExcel(
  soloActivos: boolean = true,
): Promise<void> {
  const blob = await apiFetch<Blob>(
    `/reportes/clientes-subsidio/excel?solo_activos=${soloActivos}`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte_clientes_subsidio.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export async function obtenerReportePagos(
  desde: string,
  hasta: string,
  cajeroId?: number,
): Promise<ReportePagos> {
  const params = new URLSearchParams({ desde, hasta });
  if (cajeroId !== undefined) params.set("cajero_id", String(cajeroId));
  return apiFetch<ReportePagos>(`/reportes/pagos?${params.toString()}`);
}

export function descargarReportePagosExcel(
  desde: string,
  hasta: string,
  cajeroId?: number,
): Promise<void> {
  const params = new URLSearchParams({ desde, hasta });
  if (cajeroId !== undefined) params.set("cajero_id", String(cajeroId));
  return descargarBlob(
    `/reportes/pagos/excel?${params.toString()}`,
    `reporte_pagos_${desde}_${hasta}.xlsx`,
  );
}
