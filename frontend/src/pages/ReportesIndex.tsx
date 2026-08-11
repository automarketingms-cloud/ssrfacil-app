import { Link } from "react-router-dom";

const modulos = [
  {
    titulo: "Facturación con respaldo",
    descripcion:
      "Detalle de cobros por período, con desglose y descarga en Excel/PDF.",
    ruta: "/reportes/facturacion",
    disponible: true,
  },
  {
    titulo: "Registro de presión",
    descripcion: "Mediciones de presión de servicio y cumplimiento normativo.",
    ruta: "/reportes/presion",
    disponible: true,
  },
  {
    titulo: "Continuidad del servicio",
    descripcion:
      "Registro de cortes, avisos y reposición de agua potable y alcantarillado.",
    ruta: "/reportes/continuidad",
    disponible: true,
  },
  {
    titulo: "Libro de reclamos",
    descripcion: "Reclamos con folio y seguimiento de plazo de respuesta.",
    ruta: "/reportes/reclamos",
    disponible: true,
  },
];

export default function ReportesIndex() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-text mb-1">Reportes SISS</h1>
      <p className="text-sm text-muted mb-6">
        Reportes para fiscalización de la Superintendencia de Servicios
        Sanitarios.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modulos.map((m) =>
          m.disponible ? (
            <Link
              key={m.ruta}
              to={m.ruta}
              className="block bg-surface border border-border rounded-xl p-4 hover:border-primary transition-colors"
            >
              <h3 className="font-medium text-text mb-1">{m.titulo}</h3>
              <p className="text-sm text-muted">{m.descripcion}</p>
            </Link>
          ) : (
            <div
              key={m.ruta}
              className="block bg-surface border border-border rounded-xl p-4 opacity-50 cursor-not-allowed"
            >
              <h3 className="font-medium text-text mb-1">{m.titulo}</h3>
              <p className="text-sm text-muted">{m.descripcion}</p>
              <span className="text-xs text-muted italic">Próximamente</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
