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
  es_promedio?: boolean;
}

export interface Lectura {
  id: number;
  cliente_id: number;
  fecha_lectura: string;
  periodo: string;
  lectura_actual: number;
  es_promedio: boolean;
  consumo_m3: number | null;
}

export interface LecturaUpdate {
  fecha_lectura?: string;
  periodo?: string;
  lectura_actual?: number;
  es_promedio?: boolean;
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
  cargo_fondo_reposicion: number;
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
  valor_fondo_reposicion: number;
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
  tipo_facturacion: string;
  fecha_lectura_actual: string | null;
  fecha_lectura_anterior: string | null;
  lectura_anterior: number;
  lectura_actual: number;
  consumo_m3: number;
  tarifa_aplicada: string;
  cargo_fijo: number;
  detalle_tramos: unknown[];
  monto_variable: number;
  cargo_fondo_reposicion: number;
  subtotal: number;
  subsidio_aplicado: number;
  porcentaje_subsidio_aplicado: number | null;
  m3_subsidiados: number;
  subtotal_neto: number;
  iva_aplicado: number;
  saldo_anterior: number;
  interes_mora: number;
  total_a_pagar: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  corte_en_tramite: boolean;
  estado: string;
  monto_pagado_periodo: number;
  fecha_ultimo_pago: string | null;
}

export interface ReporteFacturacionResponse {
  periodo: string;
  tarifa_vigente: string;
  cantidad_clientes_facturados: number;
  total_recaudado: number;
  telefono_atencion: string | null;
  horario_atencion: string | null;
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

export interface Factura {
  id: number;
  cliente_id: number;
  nombre_cliente: string | null;
  periodo: string;
  tipo_facturacion: string;
  lectura_anterior: number;
  lectura_actual: number;
  consumo_m3: number;
  detalle_tramos: DetalleTramo[] | null;
  cargo_fijo: number;
  monto_variable: number;
  cargo_fondo_reposicion: number;
  subsidio_aplicado: number;
  iva: number;
  saldo_anterior: number;
  interes_mora: number;
  mensaje_boleta: string | null;
  fecha_limite_corte: string | null;
  total_a_pagar: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: "pendiente" | "pagada" | "vencida" | "parcial";
  folio_sii: string | null;
  tipo_dte: string | null;
  estado_envio_sii: string | null;
  url_pdf_sii: string | null;
  creado_en: string;
}

export interface FacturaFallida {
  cliente_id: number;
  motivo: string;
}

export interface ResumenGeneracionFacturas {
  periodo: string;
  generadas: Factura[];
  cantidad_generadas: number;
  fallidas: FacturaFallida[];
  cantidad_fallidas: number;
}

export interface FacturaPendiente {
  factura_id: number;
  periodo: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  total_a_pagar: number;
  saldo: number;
  estado: string;
}

export interface PagoCreate {
  factura_id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  observaciones?: string;
}

export interface Pago {
  id: number;
  factura_id: number;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  observaciones: string | null;
  creado_en: string;
}

export interface HistorialPago {
  pago_id: number;
  factura_id: number;
  periodo: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  observaciones: string | null;
}

export interface Configuracion {
  id: number;
  nombre_empresa: string | null;
  rut_empresa: string | null;
  direccion: string | null;
  telefono: string | null;
  horario_atencion: string | null;
  email: string | null;
  giro: string | null;
  dias_plazo_pago: number;
  dia_facturacion: number;
  tasa_interes_mora: number;
}

export interface ConfiguracionUpdate {
  nombre_empresa?: string | null;
  rut_empresa?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  horario_atencion?: string | null;
  email?: string | null;
  giro?: string | null;
  dias_plazo_pago?: number;
  dia_facturacion?: number;
  tasa_interes_mora?: number;
}
