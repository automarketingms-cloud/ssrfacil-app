interface JwtPayload {
  sub: string;
  empresa_id: number | null;
  exp: number;
}

export function decodificarPayload(token: string): JwtPayload | null {
  try {
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch {
    return null;
  }
}

export function tokenExpirado(token: string): boolean {
  const payload = decodificarPayload(token);
  if (!payload?.exp) return true;

  const ahoraEnSegundos = Date.now() / 1000;
  return payload.exp < ahoraEnSegundos;
}
