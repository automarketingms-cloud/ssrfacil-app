import { useState } from "react";
import { KeyRound } from "lucide-react";

// Completa con tu correo o teléfono de soporte, ej: "soporte@ssrfacil.cl"
// Si queda vacío, el mensaje se muestra sin el dato de contacto
const CONTACTO_SOPORTE = "ms.lopez94@hotmail.com";

export default function OlvidastePassword() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="text-sm text-primary-dark hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </button>

      {abierto && (
        <div className="mt-3 text-left text-sm bg-primary-light/40 border border-primary/20 rounded-lg p-3 space-y-2">
          <p className="flex items-center gap-2 font-medium text-text">
            <KeyRound size={14} />
            Recuperar acceso
          </p>
          <p className="text-muted">
            <span className="font-medium text-text">
              Usuarios de oficina o terreno:
            </span>{" "}
            pide al administrador de tu APR que te asigne una contraseña nueva.
            Después podrás cambiarla por una propia desde Mi Perfil.
          </p>
          <p className="text-muted">
            <span className="font-medium text-text">Administradores:</span>{" "}
            comunícate con tu proveedor del sistema
            {CONTACTO_SOPORTE ? ` (${CONTACTO_SOPORTE})` : ""} para restablecer
            tu contraseña.
          </p>
        </div>
      )}
    </div>
  );
}
