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
    return <p className="text-sm text-muted">Cargando...</p>;
  }
  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </div>
    );
  }
  if (!cliente) {
    return <p className="text-sm text-muted">Cliente no encontrado.</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text">{cliente.nombre}</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            cliente.activo
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
        >
          {cliente.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="bg-surface rounded-xl border border-border divide-y divide-border">
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
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Editar
        </Link>
        <button
          onClick={handleToggleActivo}
          disabled={procesando}
          className="px-4 py-2 rounded-lg bg-gray-100 text-text text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {procesando
            ? "Procesando..."
            : cliente.activo
              ? "Desactivar"
              : "Reactivar"}
        </button>
        <button
          onClick={() => navigate("/clientes")}
          className="px-4 py-2 rounded-lg text-muted text-sm font-medium hover:bg-gray-100 transition-colors ml-auto"
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
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-text">{valor}</span>
    </div>
  );
}
