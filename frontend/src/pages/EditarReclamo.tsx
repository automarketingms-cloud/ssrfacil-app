import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerReclamo, editarReclamo } from "../api/reclamos";
import { listarClientes } from "../api/clientes";
import type { Cliente, Reclamo, ReclamoUpdate } from "../types";
import Textarea from "../components/Textarea";
import Input from "../components/Input";
import Select from "../components/Select";
import BotonVolver from "../components/BotonVolver";
import { validarRut } from "../utils/rut";

// Misma lista que en RegistrarReclamo.tsx
const TIPOS_RECLAMO = [
  "Corte no informado",
  "Calidad del agua",
  "Cobro excesivo",
  "Presión",
  "Atención al cliente",
  "Otro",
];

type ClienteMin = { id: number; nombre: string; rut: string };

export default function EditarReclamo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reclamo, setReclamo] = useState<Reclamo | null>(null);
  const [cargando, setCargando] = useState(true);

  const [tieneCliente, setTieneCliente] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteMin | null>(null);
  const [form, setForm] = useState({
    nombre_reclamante: "",
    rut_reclamante: "",
    direccion_reclamo: "",
    tipo_reclamo: TIPOS_RECLAMO[0],
    descripcion: "",
    observaciones: "",
    respuesta: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        const r = await obtenerReclamo(Number(id));
        setReclamo(r);
        setTieneCliente(r.cliente_id !== null);
        if (r.cliente_id !== null) {
          setClienteSeleccionado({
            id: r.cliente_id,
            nombre: r.nombre_reclamante ?? "",
            rut: r.rut_reclamante ?? "",
          });
        }
        setForm({
          nombre_reclamante:
            r.cliente_id === null ? (r.nombre_reclamante ?? "") : "",
          rut_reclamante: r.cliente_id === null ? (r.rut_reclamante ?? "") : "",
          direccion_reclamo: r.direccion_reclamo ?? "",
          tipo_reclamo: r.tipo_reclamo,
          descripcion: r.descripcion,
          observaciones: r.observaciones ?? "",
          respuesta: r.respuesta ?? "",
        });
      } catch {
        setError("No se pudo cargar el reclamo");
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

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
    if (!reclamo) return;
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

    if (!tieneCliente && !validarRut(form.rut_reclamante.trim())) {
      setError("El RUT del reclamante no es válido");
      return;
    }

    if (reclamo.estado === "respondido" && !form.respuesta.trim()) {
      setError("La respuesta no puede quedar vacía");
      return;
    }

    const datos: ReclamoUpdate = {
      direccion_reclamo: form.direccion_reclamo.trim() || null,
      tipo_reclamo: form.tipo_reclamo,
      descripcion: form.descripcion,
      observaciones: form.observaciones.trim() || null,
    };

    // Reclamante: solo se envía cliente_id si cambió (para no pisar el snapshot)
    if (tieneCliente) {
      if (clienteSeleccionado!.id !== reclamo.cliente_id) {
        datos.cliente_id = clienteSeleccionado!.id;
      }
    } else {
      if (reclamo.cliente_id !== null) datos.cliente_id = null;
      datos.nombre_reclamante = form.nombre_reclamante.trim();
      datos.rut_reclamante = form.rut_reclamante.trim();
    }

    if (reclamo.estado === "respondido") {
      datos.respuesta = form.respuesta;
    }

    setEnviando(true);
    try {
      await editarReclamo(reclamo.id, datos);
      navigate(`/reclamos/${reclamo.id}`, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al editar el reclamo",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <div className="p-6 text-muted">Cargando...</div>;
  if (!reclamo)
    return (
      <div className="p-6 text-red-600">{error || "Reclamo no encontrado"}</div>
    );

  if (reclamo.estado !== "abierto" && reclamo.estado !== "respondido") {
    return (
      <div className="max-w-2xl">
        <BotonVolver fallback={`/reclamos/${reclamo.id}`} />
        <div className="bg-surface border border-border rounded-xl p-6 text-sm text-muted">
          El reclamo {reclamo.folio} está cerrado y ya no se puede editar.
        </div>
      </div>
    );
  }

  // Si el tipo guardado no está en la lista, se agrega para no perderlo
  const opcionesTipo = TIPOS_RECLAMO.includes(reclamo.tipo_reclamo)
    ? TIPOS_RECLAMO
    : [reclamo.tipo_reclamo, ...TIPOS_RECLAMO];

  return (
    <div className="max-w-2xl">
      <BotonVolver fallback={`/reclamos/${reclamo.id}`} />
      <h1 className="text-xl font-semibold text-text mb-4">
        Editar Reclamo {reclamo.folio}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-surface border border-border rounded-xl p-6"
      >
        <div className="flex flex-wrap gap-4">
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
                      setClienteSeleccionado({
                        id: c.id,
                        nombre: c.nombre,
                        rut: c.rut,
                      });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          options={opcionesTipo.map((t) => ({ value: t, label: t }))}
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

        {reclamo.estado === "respondido" && (
          <Textarea
            label="Respuesta"
            name="respuesta"
            value={form.respuesta}
            onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
            rows={4}
          />
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/reclamos/${reclamo.id}`)}
            className="text-muted px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
