/**
 * Limpia el rut dejando solo números y k/K
 */
function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

/**
 * Formatea un rut mientras se escribe: 12.345.678-9
 */
export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor);
  if (limpio.length === 0) return "";

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  if (cuerpo.length === 0) return dv;

  // Agrega puntos cada 3 dígitos desde la derecha
  const cuerpoFormateado = cuerpo
    .split("")
    .reverse()
    .reduce((acc, digito, i) => {
      return digito + (i > 0 && i % 3 === 0 ? "." : "") + acc;
    }, "");

  return `${cuerpoFormateado}-${dv}`;
}

/**
 * Calcula el dígito verificador esperado para un cuerpo de rut (sin puntos ni guion)
 */
function calcularDv(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/**
 * Valida un rut chileno (acepta con o sin puntos/guion)
 */
export function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut);
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  if (!/^\d+$/.test(cuerpo)) return false;

  return calcularDv(cuerpo) === dv;
}
