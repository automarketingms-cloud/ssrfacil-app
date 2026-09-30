const TZ_CHILE = "America/Santiago";

/**
 * Fecha en formato dd-mm-aaaa.
 * Acepta "YYYY-MM-DD" (columnas Date) o fecha-hora ISO (columnas timestamptz).
 */
export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  // Fecha sin hora: se formatea tal cual. new Date("2026-09-29") la tomaría
  // como medianoche UTC y en Chile mostraría el día anterior.
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split("-");
    return `${dia}-${mes}-${anio}`;
  }
  return new Date(valor).toLocaleDateString("es-CL", {
    timeZone: TZ_CHILE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Fecha y hora en formato dd-mm-aaaa, hh:mm (hora de Chile). */
export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("es-CL", {
    timeZone: TZ_CHILE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Fecha de hoy en Chile como "YYYY-MM-DD" (para comparar con columnas Date). */
export function hoyChileISO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ_CHILE });
}
