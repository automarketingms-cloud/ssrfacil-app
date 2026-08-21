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

export interface ClienteListResponse {
  items: Cliente[];
  total: number;
  page: number;
  limit: number;
}

export interface Lectura {
  id: number;
  cliente_id: number;
  fecha_lectura: string;
  periodo: string;
  lectura_actual: number;
  consumo_m3: number | null;
  tiene_foto: boolean;
  facturada: boolean;
  es_promedio: boolean;
}

export interface LecturaListResponse {
  items: Lectura[];
  total: number;
  page: number;
  limit: number;
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
  reclamo_id?: number | null;
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
  reclamo_id: number | null;
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
  tasa_iva: number;
  numero_medidor_matriz: string;
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
  tasa_iva?: number;
  numero_medidor_matriz?: string;
}

export interface LecturaMatriz {
  id: number;
  periodo: string;
  fecha_lectura: string;
  lectura_actual: number;
  consumo_m3: number;
  observaciones?: string;
  tiene_foto: boolean;
}

export interface LecturaMatrizUpdate {
  lectura_actual?: number;
  fecha_lectura?: string;
  observaciones?: string;
}

export interface ComparativaAgua {
  periodo: string;
  consumo_matriz_m3: number;
  consumo_clientes_m3: number;
  agua_no_facturada_m3: number;
  porcentaje_perdida: number;
  tiene_lectura_matriz: boolean;
}

export interface ComparativaAguaResumen {
  consumo_matriz_m3: number;
  consumo_clientes_m3: number;
  agua_no_facturada_m3: number;
  porcentaje_perdida: number;
  tiene_datos: boolean;
}

export interface ComparativaAnual extends ComparativaAguaResumen {
  anio: string;
}

export interface CorteCreate {
  fecha_hora_inicio: string;
  tipo: "programado" | "no_programado";
  causa: string;
  sector_afectado: string;
  clientes_afectados?: number;
  observaciones?: string;
}

export interface CorteCierre {
  fecha_hora_termino: string;
}

export interface CorteResponse {
  id: number;
  fecha_hora_inicio: string;
  fecha_hora_termino: string | null;
  tipo: string;
  causa: string;
  sector_afectado: string;
  clientes_afectados: number | null;
  observaciones: string | null;
  duracion_horas: number | null;
}

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

export interface Reclamo {
  id: number;
  folio: string;
  anio: number;
  cliente_id: number | null;
  nombre_reclamante: string | null;
  rut_reclamante: string | null;
  direccion_reclamo: string | null;
  tipo_reclamo: string;
  descripcion: string;
  fecha_recepcion: string;
  plazo_vencimiento: string;
  estado: "abierto" | "respondido" | "cerrado" | "cerrado_sin_respuesta";
  fecha_respuesta: string | null;
  respuesta: string | null;
  dias_habiles_respuesta: number | null;
  fuera_de_plazo: boolean | null;
  motivo_cierre: string | null;
  observaciones: string | null;
}

export interface ReclamoCreate {
  cliente_id?: number | null;
  nombre_reclamante?: string;
  rut_reclamante?: string;
  direccion_reclamo?: string;
  tipo_reclamo: string;
  descripcion: string;
  fecha_recepcion?: string;
  observaciones?: string;
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

export interface DetalleReclamoReporte {
  folio: string;
  tipo_reclamo: string;
  nombre_reclamante: string | null;
  fecha_recepcion: string;
  plazo_vencimiento: string;
  estado: string;
  fecha_respuesta: string | null;
  dias_habiles_respuesta: number | null;
  fuera_de_plazo: boolean | null;
}

export interface ReporteReclamos {
  periodo: string;
  total_reclamos: number;
  total_respondidos: number;
  total_fuera_de_plazo: number;
  promedio_dias_habiles_respuesta: number | null;
  reclamos_por_tipo: Record<string, number>;
  reclamos_por_estado: Record<string, number>;
  detalle: DetalleReclamoReporte[];
}

export type EstadoLectura = "pendiente" | "leido";

export interface ClientePendiente {
  cliente_id: number;
  nombre: string;
  numero_medidor: string;
  direccion: string;
  estado: EstadoLectura;
}

export interface RutaLectura {
  periodo: string;
  total_pendientes: number;
  total_leidos: number;
  clientes: ClientePendiente[];
}
