import { useEffect, useState } from "react";
import type {
  Configuracion as ConfiguracionType,
  ConfiguracionUpdate,
} from "../types";
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
} from "../api/configuracion";

export default function Configuracion() {
  const [form, setForm] = useState<ConfiguracionUpdate>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setCargando(true);
      const data: ConfiguracionType = await obtenerConfiguracion();
      setForm({
        nombre_empresa: data.nombre_empresa ?? "",
        rut_empresa: data.rut_empresa ?? "",
        direccion: data.direccion ?? "",
        telefono: data.telefono ?? "",
        horario_atencion: data.horario_atencion ?? "",
        email: data.email ?? "",
        giro: data.giro ?? "",
        dias_plazo_pago: data.dias_plazo_pago,
        dia_facturacion: data.dia_facturacion,
        tasa_interes_mora: data.tasa_interes_mora,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar la configuración",
      );
    } finally {
      setCargando(false);
    }
  }

  function handleChange(
    campo: keyof ConfiguracionUpdate,
    valor: string | number,
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setExito(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);
    try {
      setGuardando(true);
      await actualizarConfiguracion(form);
      setExito(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar la configuración",
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <p className="text-muted">Cargando configuración...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-text mb-6">Configuración</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text">
            Datos de la empresa
          </h2>

          <div>
            <label className="block text-sm text-muted mb-1">
              Nombre / Razón social
            </label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.nombre_empresa ?? ""}
              onChange={(e) => handleChange("nombre_empresa", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">RUT</label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.rut_empresa ?? ""}
              onChange={(e) => handleChange("rut_empresa", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Dirección</label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.direccion ?? ""}
              onChange={(e) => handleChange("direccion", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Teléfono</label>
              <input
                type="text"
                className="w-full border border-border rounded-md px-3 py-2"
                value={form.telefono ?? ""}
                onChange={(e) => handleChange("telefono", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-border rounded-md px-3 py-2"
                value={form.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Horario de atención telefónica
            </label>
            <input
              type="text"
              placeholder="Ej: Lunes a viernes, 9:00 a 17:00 hrs"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.horario_atencion ?? ""}
              onChange={(e) => handleChange("horario_atencion", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Giro</label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.giro ?? ""}
              onChange={(e) => handleChange("giro", e.target.value)}
            />
          </div>
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text">
            Configuración de facturación
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">
                Plazo de pago (días)
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-border rounded-md px-3 py-2"
                value={form.dias_plazo_pago ?? ""}
                onChange={(e) =>
                  handleChange("dias_plazo_pago", Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">
                Día de facturación (1-31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                className="w-full border border-border rounded-md px-3 py-2"
                value={form.dia_facturacion ?? ""}
                onChange={(e) =>
                  handleChange("dia_facturacion", Number(e.target.value))
                }
              />
            </div>
          </div>
          <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text">
              Interés por mora
            </h2>
            <div>
              <label className="block text-sm text-muted mb-1">
                Tasa de interés anual (%)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full border border-border rounded-md px-3 py-2"
                value={form.tasa_interes_mora ?? ""}
                onChange={(e) =>
                  handleChange("tasa_interes_mora", Number(e.target.value))
                }
              />
              <p className="text-xs text-muted mt-1">
                Corresponde a la tasa de interés corriente publicada por la CMF
                (actualízala manualmente cuando cambie).
              </p>
            </div>
          </section>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {exito && (
          <p className="text-sm text-green-600">
            Configuración guardada correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
