import { lazy, type ComponentType } from "react";

const CLAVE = "recarga_por_chunk";

/**
 * Igual que React.lazy, pero si falla la descarga del chunk (típico después
 * de un deploy: la pestaña abierta pide un archivo con hash viejo que ya no
 * existe) recarga la página una sola vez para traer la versión nueva.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyConReintento<T extends ComponentType<any>>(
  importar: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const modulo = await importar();
      sessionStorage.removeItem(CLAVE);
      return modulo;
    } catch (error) {
      if (!sessionStorage.getItem(CLAVE)) {
        sessionStorage.setItem(CLAVE, "1");
        window.location.reload();
        return new Promise<never>(() => {}); // no resuelve: la página se recarga
      }
      throw error;
    }
  });
}
