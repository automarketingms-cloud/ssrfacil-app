import type { MedicionPresion, Usuario } from "../types";
import { periodoActualChile } from "./fechas";

/**
 * Misma regla que editar_medicion en el backend:
 * - admin: cualquier medición, sin límite de fecha
 * - oficina: cualquier medición del mes en curso
 * - terreno: solo las que registró, del mes en curso
 */
export function puedeEditarMedicion(
  m: MedicionPresion,
  usuario: Usuario | null,
): boolean {
  if (!usuario) return false;
  if (usuario.rol === "admin") return true;
  if (m.fecha_medicion.slice(0, 7) !== periodoActualChile()) return false;
  if (usuario.rol === "terreno") return m.registrado_por_id === usuario.id;
  return usuario.rol === "oficina";
}
