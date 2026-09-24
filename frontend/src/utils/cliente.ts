import type { Cliente } from "../types";

export function etiquetaSocio(esSocio: boolean): string {
  return esSocio ? "Socio" : "Usuario";
}

export function etiquetaTipoCliente(
  tipo: Cliente["tipo_cliente"],
  corta = false,
): string {
  if (tipo === "persona_natural") return corta ? "Natural" : "Persona natural";
  if (tipo === "persona_juridica")
    return corta ? "Jurídica" : "Persona jurídica";
  return "—";
}
