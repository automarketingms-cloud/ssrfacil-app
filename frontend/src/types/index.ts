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
