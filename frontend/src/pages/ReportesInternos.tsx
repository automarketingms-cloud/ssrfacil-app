import { Link } from "react-router-dom";

interface ReporteInterno {
  titulo: string;
  descripcion: string;
  ruta: string;
  disponible: boolean;
}

const reportes: ReporteInterno[] = [
  {
    titulo: "Agua No Facturada",
    descripcion:
      "Comparativa entre el medidor matriz y el consumo sumado de todos los clientes, para detectar pérdidas o fugas",
    ruta: "/reportes-internos/agua-no-facturada",
    disponible: true,
  },
];

export default function ReportesInternos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Reportes Internos</h1>
        <p className="text-sm text-muted">
          Reportes de gestión interna, distintos de los reportes normativos de
          Reportes SISS
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportes.map((r) => (
          <Link
            key={r.ruta}
            to={r.disponible ? r.ruta : "#"}
            className={`rounded-lg border border-border bg-surface p-4 transition ${
              r.disponible
                ? "hover:border-primary hover:shadow-sm"
                : "cursor-not-allowed opacity-50"
            }`}
            onClick={(e) => !r.disponible && e.preventDefault()}
          >
            <h2 className="text-sm font-semibold text-text">{r.titulo}</h2>
            <p className="mt-1 text-xs text-muted">{r.descripcion}</p>
            {!r.disponible && (
              <span className="mt-2 inline-block text-xs text-muted">
                Próximamente
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
