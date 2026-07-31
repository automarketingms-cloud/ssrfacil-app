// pages/ListarReclamos.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarReclamos, type Reclamo } from "../api/reclamos";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "abierto", label: "Abierto" },
  { value: "respondido", label: "Respondido" },
  { value: "cerrado", label: "Cerrado" },
  { value: "cerrado_sin_respuesta", label: "Cerrado sin respuesta" },
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function badgeEstado(reclamo: Reclamo) {
  if (reclamo.estado === "abierto" && reclamo.plazo_vencimiento < hoyISO()) {
    return (
      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
        Fuera de plazo
      </span>
    );
  }
  const estilos: Record<string, string> = {
    abierto: "bg-yellow-100 text-yellow-700",
    respondido: "bg-blue-100 text-blue-700",
    cerrado: "bg-green-100 text-green-700",
    cerrado_sin_respuesta: "bg-gray-100 text-muted",
  };
  const etiquetas: Record<string, string> = {
    abierto: "Abierto",
    respondido: "Respondido",
    cerrado: "Cerrado",
    cerrado_sin_respuesta: "Cerrado sin respuesta",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs ${estilos[reclamo.estado]}`}>
      {etiquetas[reclamo.estado]}
    </span>
  );
}

export default function ListarReclamos() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [periodo, setPeriodo] = useState("");
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const datos = await listarReclamos({
        periodo: periodo || undefined,
        estado: estado || undefined,
      });
      setReclamos(datos);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, estado]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-text">Libro de Reclamos</h1>
        <Link
          to="/reclamos/nuevo"
          className="bg-primary text-white px-4 py-2 rounded"
        >
          + Registrar reclamo
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="border border-border rounded px-3 py-2"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="border border-border rounded px-3 py-2"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-muted text-left">
            <tr>
              <th className="px-4 py-2">Folio</th>
              <th className="px-4 py-2">Reclamante</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Fecha recepción</th>
              <th className="px-4 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : reclamos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Sin reclamos para este filtro
                </td>
              </tr>
            ) : (
              reclamos.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-gray-50"
                >
                  <td className="px-4 py-2">
                    <Link
                      to={`/reclamos/${r.id}`}
                      className="text-primary font-medium"
                    >
                      {r.folio}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{r.nombre_reclamante ?? "—"}</td>
                  <td className="px-4 py-2">{r.tipo_reclamo}</td>
                  <td className="px-4 py-2">
                    {r.fecha_recepcion.slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">{badgeEstado(r)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
