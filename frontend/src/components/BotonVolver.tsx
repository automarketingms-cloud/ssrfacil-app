import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BotonVolverProps {
  /** Ruta a la que ir si no hay página anterior dentro de la app */
  fallback: string;
  label?: string;
}

export default function BotonVolver({
  fallback,
  label = "Volver",
}: BotonVolverProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick() {
    // React Router marca con key "default" la primera página cargada:
    // si es así, no hay historial propio de la app y usamos el fallback
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-dark transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
