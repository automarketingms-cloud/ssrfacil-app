export function aNumeroOVacio(valor: string): number | undefined {
  return valor === "" ? undefined : Number(valor);
}
