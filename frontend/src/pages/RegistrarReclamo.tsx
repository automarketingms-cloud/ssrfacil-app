import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearReclamo } from "../api/reclamos";
import { listarClientes } from "../api/clientes";
import type { Cliente } from "../types";

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
    const resultado = await listarClientes({ activo: true });
    const filtrados = resultado.filter(
      (c) =>
        c.nombre.toLowerCase().includes(texto.toLowerCase()) ||
        c.rut.toLowerCase().includes(texto.toLowerCase()),
    );
    setClientes(filtrados);
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text mb-4">
        Registrar Reclamo
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-surface border border-border rounded-lg p-6"
      >
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setTieneCliente(true)}
            className={`px-4 py-2 rounded ${tieneCliente ? "bg-primary text-white" : "bg-gray-100 text-muted"}`}
          >
            Cliente registrado
          </button>
          <button
            type="button"
            onClick={() => setTieneCliente(false)}
            className={`px-4 py-2 rounded ${!tieneCliente ? "bg-primary text-white" : "bg-gray-100 text-muted"}`}
          >
            Sin cliente registrado
          </button>
        </div>

        {tieneCliente ? (
          <div className="relative">
            <label className="block text-sm text-muted mb-1">
              Buscar cliente (nombre o RUT)
            </label>
            <input
              type="text"
              value={
                clienteSeleccionado ? clienteSeleccionado.nombre : busqueda
              }
              onChange={(e) => {
                setClienteSeleccionado(null);
                buscarClientes(e.target.value);
              }}
              className="w-full border border-border rounded px-3 py-2"
              placeholder="Escribe para buscar..."
            />
            {clientes.length > 0 && !clienteSeleccionado && (
              <div className="absolute z-10 w-full bg-white border border-border rounded mt-1 max-h-48 overflow-y-auto">
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
            <div>
              <label className="block text-sm text-muted mb-1">
                Nombre reclamante
              </label>
              <input
                type="text"
                value={form.nombre_reclamante}
                onChange={(e) =>
                  setForm({ ...form, nombre_reclamante: e.target.value })
                }
                className="w-full border border-border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">
                RUT reclamante
              </label>
              <input
                type="text"
                value={form.rut_reclamante}
                onChange={(e) =>
                  setForm({ ...form, rut_reclamante: e.target.value })
                }
                className="w-full border border-border rounded px-3 py-2"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-muted mb-1">
            Dirección del reclamo (opcional)
          </label>
          <input
            type="text"
            value={form.direccion_reclamo}
            onChange={(e) =>
              setForm({ ...form, direccion_reclamo: e.target.value })
            }
            className="w-full border border-border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">
            Tipo de reclamo
          </label>
          <select
            value={form.tipo_reclamo}
            onChange={(e) => setForm({ ...form, tipo_reclamo: e.target.value })}
            className="w-full border border-border rounded px-3 py-2"
          >
            {TIPOS_RECLAMO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="w-full border border-border rounded px-3 py-2"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            value={form.observaciones}
            onChange={(e) =>
              setForm({ ...form, observaciones: e.target.value })
            }
            className="w-full border border-border rounded px-3 py-2"
            rows={2}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Registrar reclamo"}
        </button>
      </form>
    </div>
  );
}
