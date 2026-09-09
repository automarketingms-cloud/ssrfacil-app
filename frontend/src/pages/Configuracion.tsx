import { useEffect, useState } from "react";
import type {
  Configuracion as ConfiguracionType,
  ConfiguracionUpdate,
  CafSii,
} from "../types";
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
} from "../api/configuracion";
import { subirCertificado } from "../api/certificado";
import { subirCaf, listarCafs } from "../api/caf";
import { formatearRut, validarRut } from "../utils/rut";

export default function Configuracion() {
  const [form, setForm] = useState<ConfiguracionUpdate>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [rutError, setRutError] = useState<string | null>(null);
  const [actividadEconomicaTexto, setActividadEconomicaTexto] = useState("");

  // --- Facturación electrónica (SII) ---
  const [archivoCertificado, setArchivoCertificado] = useState<File | null>(
    null,
  );
  const [passwordCertificado, setPasswordCertificado] = useState("");
  const [subiendoCertificado, setSubiendoCertificado] = useState(false);
  const [errorCertificado, setErrorCertificado] = useState<string | null>(null);
  const [exitoCertificado, setExitoCertificado] = useState(false);
  const [certificadoCargado, setCertificadoCargado] = useState<string | null>(
    null,
  );

  const [archivoCaf, setArchivoCaf] = useState<File | null>(null);
  const [subiendoCaf, setSubiendoCaf] = useState(false);
  const [errorCaf, setErrorCaf] = useState<string | null>(null);
  const [cafs, setCafs] = useState<CafSii[]>([]);
  const [cargandoCafs, setCargandoCafs] = useState(true);

  useEffect(() => {
    cargarConfiguracion();
    cargarCafs();
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
        comuna: data.comuna ?? "",
        actividad_economica: data.actividad_economica ?? [],
        numero_medidor_matriz: data.numero_medidor_matriz ?? "",
        dias_plazo_pago: data.dias_plazo_pago,
        dia_facturacion: data.dia_facturacion,
        tasa_interes_mora: data.tasa_interes_mora,
        tasa_iva: data.tasa_iva,
      });
      setActividadEconomicaTexto((data.actividad_economica ?? []).join(", "));
      setCertificadoCargado(data.certificado_pfx_path);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar la configuración",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarCafs() {
    try {
      setCargandoCafs(true);
      const data = await listarCafs();
      setCafs(data);
    } catch {
      // silencioso: no bloquea el resto de la pantalla si falla
    } finally {
      setCargandoCafs(false);
    }
  }

  function handleChange(
    campo: keyof ConfiguracionUpdate,
    valor: string | number,
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setExito(false);
  }

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formateado = formatearRut(e.target.value);
    handleChange("rut_empresa", formateado);

    if (formateado.length === 0) {
      setRutError(null);
    } else if (!validarRut(formateado)) {
      setRutError("RUT inválido");
    } else {
      setRutError(null);
    }
  }

  function handleActividadEconomicaChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const texto = e.target.value;
    setActividadEconomicaTexto(texto);

    const codigos = texto
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .map(Number)
      .filter((n) => !isNaN(n));

    setForm((prev) => ({ ...prev, actividad_economica: codigos }));
    setExito(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (form.rut_empresa && !validarRut(form.rut_empresa)) {
      setRutError("RUT inválido");
      return;
    }

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

  async function handleSubirCertificado(e: React.FormEvent) {
    e.preventDefault();
    setErrorCertificado(null);
    setExitoCertificado(false);

    if (!archivoCertificado) {
      setErrorCertificado("Selecciona el archivo .pfx del certificado");
      return;
    }
    if (!passwordCertificado) {
      setErrorCertificado("Ingresa la contraseña del certificado");
      return;
    }

    try {
      setSubiendoCertificado(true);
      const resultado = await subirCertificado(
        archivoCertificado,
        passwordCertificado,
      );
      setExitoCertificado(true);
      setCertificadoCargado(resultado.certificado_pfx_path);
      setArchivoCertificado(null);
      setPasswordCertificado("");
    } catch (err) {
      setErrorCertificado(
        err instanceof Error ? err.message : "Error al subir el certificado",
      );
    } finally {
      setSubiendoCertificado(false);
    }
  }

  async function handleSubirCaf(e: React.FormEvent) {
    e.preventDefault();
    setErrorCaf(null);

    if (!archivoCaf) {
      setErrorCaf("Selecciona el archivo XML del CAF");
      return;
    }

    try {
      setSubiendoCaf(true);
      await subirCaf(archivoCaf);
      setArchivoCaf(null);
      await cargarCafs();
    } catch (err) {
      setErrorCaf(err instanceof Error ? err.message : "Error al subir el CAF");
    } finally {
      setSubiendoCaf(false);
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
              onChange={handleRutChange}
              placeholder="12.345.678-9"
              maxLength={12}
            />
            {rutError && (
              <p className="text-xs text-red-600 mt-1">{rutError}</p>
            )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm text-muted mb-1">Comuna</label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.comuna ?? ""}
              onChange={(e) => handleChange("comuna", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              Actividad económica (códigos SII)
            </label>
            <input
              type="text"
              placeholder="Ej: 360000, 410000"
              className="w-full border border-border rounded-md px-3 py-2"
              value={actividadEconomicaTexto}
              onChange={handleActividadEconomicaChange}
            />
            <p className="text-xs text-muted mt-1">
              Separa los códigos con coma si hay más de uno. Los encuentras en
              tu inicio de actividades en sii.cl.
            </p>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">
              N° Medidor Matriz
            </label>
            <input
              type="text"
              className="w-full border border-border rounded-md px-3 py-2"
              value={form.numero_medidor_matriz ?? ""}
              onChange={(e) =>
                handleChange("numero_medidor_matriz", e.target.value)
              }
            />
          </div>
        </section>

        <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text">
            Configuración de facturación
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <h2 className="text-sm font-semibold text-text">Tasas</h2>
            <div>
              <label className="block text-sm text-muted mb-1">
                Tasa de interés anual por mora (%)
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
            <div>
              <label className="block text-sm text-muted mb-1">
                Tasa de IVA (%)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full border border-border rounded-md px-3 py-2"
                value={form.tasa_iva ?? ""}
                onChange={(e) =>
                  handleChange("tasa_iva", Number(e.target.value))
                }
              />
              <p className="text-xs text-muted mt-1">
                Se aplica solo a clientes no socios, sobre el neto a pagar.
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

        <div className="px-6">
          <button
            type="submit"
            disabled={guardando}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      <section className="bg-surface border border-border rounded-lg p-6 space-y-6 mt-8">
        <h2 className="text-sm font-semibold text-text">
          Facturación electrónica (SII)
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text">Certificado digital</h3>

          {certificadoCargado && (
            <div className="text-sm text-primary-dark bg-primary-light border border-primary/20 rounded-lg px-3 py-2">
              ✓ Certificado cargado. Si subes uno nuevo, reemplazará al actual.
            </div>
          )}

          <form onSubmit={handleSubirCertificado} className="space-y-3">
            <div>
              <label className="block text-sm text-muted mb-1">
                Archivo (.pfx)
              </label>
              <label
                htmlFor="input-certificado"
                className="flex items-center justify-start border border-dashed border-border rounded-lg px-3 py-4 text-sm text-muted cursor-pointer transition-colors hover:bg-primary-light hover:border-primary"
              >
                {archivoCertificado
                  ? archivoCertificado.name
                  : "Selecciona un archivo .pfx"}
              </label>
              <input
                id="input-certificado"
                type="file"
                accept=".pfx"
                className="hidden"
                onChange={(e) =>
                  setArchivoCertificado(e.target.files?.[0] ?? null)
                }
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">
                Contraseña del certificado
              </label>
              <input
                type="password"
                className="w-full border border-border rounded-md px-3 py-2"
                value={passwordCertificado}
                onChange={(e) => setPasswordCertificado(e.target.value)}
              />
            </div>
            {errorCertificado && (
              <p className="text-sm text-red-600">{errorCertificado}</p>
            )}
            {exitoCertificado && (
              <p className="text-sm text-green-600">
                Certificado cargado correctamente.
              </p>
            )}
            <button
              type="submit"
              disabled={subiendoCertificado}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {subiendoCertificado ? "Subiendo..." : "Subir certificado"}
            </button>
          </form>
        </div>

        <div className="space-y-3 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-text">
            CAF (rangos de folios)
          </h3>
          <form onSubmit={handleSubirCaf} className="space-y-3">
            <div>
              <label className="block text-sm text-muted mb-1">
                Archivo CAF (.xml)
              </label>
              <label
                htmlFor="input-caf"
                className="flex items-center justify-start border border-dashed border-border rounded-lg px-3 py-4 text-sm text-muted cursor-pointer transition-colors hover:bg-primary-light hover:border-primary"
              >
                {archivoCaf ? archivoCaf.name : "Selecciona un archivo .xml"}
              </label>
              <input
                id="input-caf"
                type="file"
                accept=".xml"
                className="hidden"
                onChange={(e) => setArchivoCaf(e.target.files?.[0] ?? null)}
              />
            </div>
            <button
              type="submit"
              disabled={subiendoCaf}
              className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {subiendoCaf ? "Subiendo..." : "Subir CAF"}
            </button>
          </form>
          {errorCaf && <p className="text-sm text-red-600">{errorCaf}</p>}

          {cargandoCafs ? (
            <p className="text-sm text-muted">Cargando CAFs...</p>
          ) : cafs.length === 0 ? (
            <p className="text-sm text-muted">No hay CAFs cargados todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-2">Tipo DTE</th>
                  <th className="py-2">Rango</th>
                  <th className="py-2">Folios restantes</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cafs.map((caf) => (
                  <tr key={caf.id} className="border-b border-border">
                    <td className="py-2">{caf.tipo_dte}</td>
                    <td className="py-2">
                      {caf.folio_desde} - {caf.folio_hasta}
                    </td>
                    <td className="py-2">{caf.folios_restantes}</td>
                    <td className="py-2">
                      {caf.activo ? "Activo" : "Agotado"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
