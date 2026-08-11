const API_URL = import.meta.env.VITE_API_URL;

export interface FacturacionMes {
  periodo: string;
  facturado: number;
  cobrado: number;
}

export interface ResumenDashboard {
  periodo: string;
  clientes_activos: number;
  socios_activos: number;
  clientes_con_subsidio: number;
  facturacion_total_mes: number;
  consumo_total_m3: number;
  lecturas_realizadas: number;
  medidores_sin_lectura: number;
  reclamos_abiertos: number;
  reclamos_fuera_de_plazo: number;
  cortes_activos: number;
  monto_pendiente_cobro: number;
  clientes_morosos: number;
  facturacion_ultimos_6_meses: FacturacionMes[];
}

export async function obtenerResumenDashboard(
  periodo: string,
): Promise<ResumenDashboard> {
  const res = await fetch(`${API_URL}/dashboard/resumen?periodo=${periodo}`);
  if (!res.ok) {
    throw new Error("No se pudo obtener el resumen del dashboard");
  }
  return res.json();
}
