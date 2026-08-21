import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearReclamo } from "../api/reclamos";
import { listarClientes } from "../api/clientes";
import type { Cliente } from "../types";
import Textarea from "../components/Textarea";
import Input from "../components/Input";
import Select from "../components/Select";

const TIPOS_RECLAMO = [
  "Corte no informado",
  "Calidad del agua",
  "Cobro excesivo",
  "Presión",
  "Atención al cliente",
  "Otro",
];

export default function RegistrarReclamo() {
  const navigate = useNavigate();
  const [tieneCliente, setTieneCliente] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nombre_reclamante: "",
    rut_reclamante: "",
    direccion_reclamo: "",
    tipo_reclamo: TIPOS_RECLAMO[0],
    descripcion: "",
    observaciones: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function buscarClientes(texto: string) {
    setBusqueda(texto);
    if (texto.length < 2) {
      setClientes([]);
      return;
    }
    const resultado = await listarClientes({
      activo: true,
      q: texto,
      limit: 20,
    });
    setClientes(resultado.items);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.descripcion.trim()) {
      setError("La descripción del reclamo es obligatoria");
      return;
    }
    if (tieneCliente && !clienteSeleccionado) {
      setError(
        "Selecciona un cliente o cambia a 'reclamo sin cliente registrado'",
      );
      return;
    }
    if (
      !tieneCliente &&
      (!form.nombre_reclamante.trim() || !form.rut_reclamante.trim())
    ) {
      setError(
        "Nombre y RUT del reclamante son obligatorios si no hay cliente registrado",
      );
      return;
    }

    setEnviando(true);
    try {
      const nuevo = await crearReclamo({
        cliente_id: tieneCliente ? clienteSeleccionado!.id : null,
        nombre_reclamante: tieneCliente ? undefined : form.nombre_reclamante,
        rut_reclamante: tieneCliente ? undefined : form.rut_reclamante,
        direccion_reclamo: form.direccion_reclamo || undefined,
        tipo_reclamo: form.tipo_reclamo,
        descripcion: form.descripcion,
        observaciones: form.observaciones || undefined,
      });
      navigate(`/reclamos/${nuevo.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar el reclamo",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-text mb-4">
        Registrar Reclamo
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-surface border border-border rounded-xl p-6"
      >
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setTieneCliente(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tieneCliente ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}
          >
            Cliente registrado
          </button>
          <button
            type="button"
            onClick={() => setTieneCliente(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!tieneCliente ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}
          >
            Sin cliente registrado
          </button>
        </div>

        {tieneCliente ? (
          <div className="relative">
            <Input
              label="Buscar cliente (nombre o RUT)"
              name="busqueda_cliente"
              value={
                clienteSeleccionado ? clienteSeleccionado.nombre : busqueda
              }
              onChange={(e) => {
                setClienteSeleccionado(null);
                buscarClientes(e.target.value);
              }}
              placeholder="Escribe para buscar..."
            />
            {clientes.length > 0 && !clienteSeleccionado && (
              <div className="absolute z-10 w-full bg-surface border border-border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-md">
                {clientes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClienteSeleccionado(c);
                      setClientes([]);
                    }}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    {c.nombre} — {c.rut}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre reclamante"
              name="nombre_reclamante"
              value={form.nombre_reclamante}
              onChange={(e) =>
                setForm({ ...form, nombre_reclamante: e.target.value })
              }
            />
            <Input
              label="RUT reclamante"
              name="rut_reclamante"
              value={form.rut_reclamante}
              onChange={(e) =>
                setForm({ ...form, rut_reclamante: e.target.value })
              }
            />
          </div>
        )}

        <Input
          label="Dirección del reclamo (opcional)"
          name="direccion_reclamo"
          value={form.direccion_reclamo}
          onChange={(e) =>
            setForm({ ...form, direccion_reclamo: e.target.value })
          }
        />

        <Select
          label="Tipo de reclamo"
          name="tipo_reclamo"
          value={form.tipo_reclamo}
          onChange={(e) => setForm({ ...form, tipo_reclamo: e.target.value })}
          options={TIPOS_RECLAMO.map((t) => ({ value: t, label: t }))}
        />

        <Textarea
          label="Descripción"
          name="descripcion"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          rows={4}
        />

        <Textarea
          label="Observaciones (opcional)"
          name="observaciones"
          value={form.observaciones}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          rows={2}
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Registrar reclamo"}
        </button>
      </form>
    </div>
  );
}
