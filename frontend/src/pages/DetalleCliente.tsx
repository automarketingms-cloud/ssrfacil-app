import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  obtenerCliente,
  desactivarCliente,
  reactivarCliente,
} from "../api/clientes";
import type { Cliente } from "../types";

export default function DetalleCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!id) return;
    cargarCliente(Number(id));
  }, [id]);

  async function cargarCliente(clienteId: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerCliente(clienteId);
      setCliente(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActivo() {
    if (!cliente) return;
    setProcesando(true);
    try {
      const actualizado = cliente.activo
        ? await desactivarCliente(cliente.id)
        : await reactivarCliente(cliente.id);
      setCliente(actualizado);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar estado",
      );
    } finally {
      setProcesando(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!cliente) {
    return <div className="p-6 text-gray-500">Cliente no encontrado.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {cliente.nombre}
        </h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            cliente.activo
              ? "bg-sky-100 text-sky-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {cliente.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <Dato label="RUT" valor={cliente.rut} />
        <Dato label="Dirección" valor={cliente.direccion} />
        <Dato label="N° medidor" valor={cliente.numero_medidor} />
        <Dato label="Fecha de ingreso" valor={cliente.fecha_ingreso ?? "—"} />
        <Dato label="Socio" valor={cliente.es_socio ? "Sí" : "No"} />
        <Dato
          label="Subsidio"
          valor={
            cliente.tiene_subsidio
              ? `Sí (${(cliente.porcentaje_subsidio * 100).toFixed(0)}%)`
              : "No"
          }
        />
      </div>

      <div className="flex gap-3 mt-6">
        <Link
          to={`/clientes/${cliente.id}/editar`}
          className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition"
        >
          Editar
        </Link>
        <button
          onClick={handleToggleActivo}
          disabled={procesando}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
        >
          {procesando
            ? "Procesando..."
            : cliente.activo
              ? "Desactivar"
              : "Reactivar"}
        </button>
        <button
          onClick={() => navigate("/clientes")}
          className="px-4 py-2 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-100 transition ml-auto"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="flex justify-between px-5 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{valor}</span>
    </div>
  );
}
