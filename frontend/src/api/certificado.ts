import { apiFetch } from "./http";

export async function subirCertificado(
  archivo: File,
  password: string,
): Promise<{ mensaje: string; certificado_pfx_path: string }> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("password", password);

  return apiFetch<{ mensaje: string; certificado_pfx_path: string }>(
    "/configuracion/certificado",
    {
      method: "POST",
      body: formData,
    },
  );
}
