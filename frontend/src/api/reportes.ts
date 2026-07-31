import type { ReporteFacturacionResponse } from "../types";
import type { CorteResponse } from "./continuidad";

const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerReporteFacturacion(
  periodo: string,
): Promise<ReporteFacturacionResponse> {
  const res = await fetch(`${API_URL}/reportes/facturacion/${periodo}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || "Error al obtener el reporte de facturación",
    );
  }
  return res.json();
}

export function urlDescargaExcel(periodo: string): string {
  return `${API_URL}/reportes/facturacion/${periodo}/excel`;
}

export function urlDescargaPdf(periodo: string): string {
  return `${API_URL}/reportes/facturacion/${periodo}/pdf`;
}

export function urlDescargaExcelPresion(
  desde?: string,
  hasta?: string,
): string {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  return `${API_URL}/reportes/presion/excel?${params.toString()}`;
}

export function urlDescargaPdfPresion(desde?: string, hasta?: string): string {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  return `${API_URL}/reportes/presion/pdf?${params.toString()}`;
}

export interface ReporteContinuidad {
  periodo: string;
  total_cortes: number;
  total_activos: number;
  total_cerrados: number;
  duracion_promedio_horas: number;
  duracion_total_horas: number;
  total_clientes_afectados: number;
  cortes_por_tipo: Record<string, number>;
  cortes_activos: CorteResponse[];
  cortes_cerrados: CorteResponse[];
}

export async function obtenerReporteContinuidad(
  periodo: string,
): Promise<ReporteContinuidad> {
  const res = await fetch(`${API_URL}/reportes/continuidad/${periodo}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.detail || "Error al obtener el reporte de continuidad",
    );
  }
  return res.json();
}

export function urlReporteContinuidadExcel(periodo: string): string {
  return `${API_URL}/reportes/continuidad/${periodo}/excel`;
}

export function urlReporteContinuidadPdf(periodo: string): string {
  return `${API_URL}/reportes/continuidad/${periodo}/pdf`;
}

export interface ReporteReclamos {
  periodo: string;
  total_reclamos: number;
  total_respondidos: number;
  total_fuera_de_plazo: number;
  promedio_dias_habiles_respuesta: number | null;
  reclamos_por_tipo: Record<string, number>;
  reclamos_por_estado: Record<string, number>;
  detalle: Array<{
    folio: string;
    tipo_reclamo: string;
    nombre_reclamante: string | null;
    fecha_recepcion: string;
    plazo_vencimiento: string;
    estado: string;
    fecha_respuesta: string | null;
    dias_habiles_respuesta: number | null;
    fuera_de_plazo: boolean | null;
  }>;
}

export async function obtenerReporteReclamos(
  periodo: string,
): Promise<ReporteReclamos> {
  const res = await fetch(`${API_URL}/reportes/reclamos/${periodo}`);
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Error al obtener el reporte de reclamos");
  }
  return res.json();
}

export function urlReporteReclamosExcel(periodo: string): string {
  return `${API_URL}/reportes/reclamos/${periodo}/excel`;
}

export function urlReporteReclamosPdf(periodo: string): string {
  return `${API_URL}/reportes/reclamos/${periodo}/pdf`;
}
