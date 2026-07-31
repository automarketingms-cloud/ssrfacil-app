export interface Cliente {
  id: number;
  nombre: string;
  rut: string;
  direccion: string;
  numero_medidor: string;
  fecha_ingreso?: string;
  activo: boolean;
  es_socio: boolean;
  tiene_subsidio: boolean;
  porcentaje_subsidio: number;
}

export interface LecturaInput {
  cliente_id: number;
  fecha_lectura: string; // "2026-07-23"
  periodo: string; // "2026-07"
  lectura_actual: number;
}

export interface Lectura {
  id: number;
  cliente_id: number;
  fecha_lectura: string;
  periodo: string;
  lectura_actual: number;
  consumo_m3: number | null;
}

export interface LecturaUpdate {
  fecha_lectura?: string;
  periodo?: string;
  lectura_actual?: number;
}

export interface DetalleTramo {
  numero_tramo: number;
  m3_en_tramo: number;
  precio_m3: number;
  subtotal: number;
}

export interface ConsumoResponse {
  cliente_id: number;
  nombre_cliente: string;
  es_socio: boolean;
  periodo: string;
  lectura_anterior: number;
  lectura_actual: number;
  consumo_m3: number;
  tarifa_aplicada: string;
  cargo_fijo: number;
  detalle_tramos: DetalleTramo[];
  monto_variable: number;
  subsidio_aplicado: number;
  subtotal_neto: number;
  iva_aplicado: number;
  total_a_pagar: number;
}

export interface TarifaTramo {
  numero_tramo: number;
  desde_m3: number;
  hasta_m3: number | null;
  precio_m3: number;
}

export interface Tarifa {
  id: number;
  nombre: string;
  cargo_fijo: number;
  vigente_desde: string; // formato "YYYY-MM-DD"
  tramos: TarifaTramo[];
}

export interface DetalleFacturacion {
  cliente_id: number;
  nombre_cliente: string;
  rut: string;
  direccion: string | null;
  numero_medidor: string;
  es_socio: boolean;
  tiene_subsidio: boolean;
  periodo: string;
  fecha_lectura: string;
  lectura_anterior: number;
  lectura_actual: number;
  consumo_m3: number;
  tarifa_aplicada: string;
  cargo_fijo: number;
  detalle_tramos: unknown[];
  monto_variable: number;
  subsidio_aplicado: number;
  subtotal_neto: number;
  iva_aplicado: number;
  total_a_pagar: number;
}

export interface ReporteFacturacionResponse {
  periodo: string;
  tarifa_vigente: string;
  cantidad_clientes_facturados: number;
  total_recaudado: number;
  detalle: DetalleFacturacion[];
}

export interface MedicionPresionCreate {
  punto_medicion: string;
  ubicacion?: string;
  fecha_medicion: string;
  hora_medicion?: string;
  presion_mca: number;
  observaciones?: string;
}

export interface MedicionPresion {
  id: number;
  punto_medicion: string;
  ubicacion: string | null;
  fecha_medicion: string;
  hora_medicion: string | null;
  presion_mca: number;
  observaciones: string | null;
  rango_minimo: number;
  rango_maximo: number;
  cumple: boolean;
}
