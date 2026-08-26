const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function formatearErrorDetail(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        if (typeof err?.msg === "string") {
          const campo = Array.isArray(err.loc) ? err.loc.at(-1) : null;
          return campo ? `${campo}: ${err.msg}` : err.msg;
        }
        return JSON.stringify(err);
      })
      .join(" | ");
  }

  return "Error en la solicitud";
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    ...(!(rest.body instanceof FormData) && {
      "Content-Type": "application/json",
    }),
    ...headers,
  };

  if (!skipAuth) {
    const token = localStorage.getItem("access_token");
    if (token) {
      (finalHeaders as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
    window.location.href = "/login";
    throw new ApiError(401, "Sesión expirada");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(response.status, formatearErrorDetail(errorBody.detail));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
