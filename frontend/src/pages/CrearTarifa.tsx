import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearTarifa } from "../api/tarifas";
import type { TarifaTramo } from "../types";
import { formatoCLP } from "../utils/formato";
import ConfirmDialog from "../components/ConfirmDialog";

const tramoVacio = (numero: number, desde: number): TarifaTramo => ({
  numero_tramo: numero,
  desde_m3: desde,
  hasta_m3: null,
  precio_m3: 0,
});

export default function CrearTarifa() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [cargoFijo, setCargoFijo] = useState(0);
  const [valorFondoReposicion, setValorFondoReposicion] = useState(0);
  const [vigenteDesde, setVigenteDesde] = useState("");
  const [tramos, setTramos] = useState<TarifaTramo[]>([tramoVacio(1, 1)]);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  function handleTramoChange(
    index: number,
    campo: keyof TarifaTramo,
    valor: string,
  ) {
    setTramos((prev) => {
      const actualizados = prev.map((t, i) => {
        if (i !== index) return t;
        if (campo === "hasta_m3") {
          return { ...t, hasta_m3: valor === "" ? null : Number(valor) };
        }
        return { ...t, [campo]: Number(valor) };
      });

      if (campo === "hasta_m3" && actualizados[index + 1]) {
        const hasta = actualizados[index].hasta_m3;
        if (hasta !== null) {
          actualizados[index + 1] = {
            ...actualizados[index + 1],
            desde_m3: hasta + 1,
          };
        }
      }

      return actualizados;
    });
  }

  function agregarTramo() {
    setTramos((prev) => {
      const anterior = prev[prev.length - 1];
      const desdeSugerido =
        anterior.hasta_m3 !== null ? anterior.hasta_m3 + 1 : 0;
      return [...prev, tramoVacio(prev.length + 1, desdeSugerido)];
    });
  }

  function quitarTramo(index: number) {
    setTramos((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((t, i) => ({
          ...t,
          numero_tramo: i + 1,
          desde_m3: i === 0 ? 1 : t.desde_m3,
        })),
    );
  }

  function handleAbrirConfirmacion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tramos.length === 0) {
      setError("Debes agregar al menos un tramo");
      return;
    }

    setMostrarConfirmacion(true);
  }

  async function handleConfirmarGuardado() {
    setGuardando(true);
    setError(null);
    try {
      await crearTarifa({
        nombre,
        cargo_fijo: cargoFijo,
        valor_fondo_reposicion: valorFondoReposicion,
        vigente_desde: vigenteDesde,
        tramos,
      });
      navigate("/tarifas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setMostrarConfirmacion(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-text mb-1">Nueva tarifa</h1>
      <p className="text-sm text-muted mb-6">
        Crea una tarifa nueva. Las tarifas anteriores no se modifican; esta se
        aplicará automáticamente desde su fecha de vigencia.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAbrirConfirmacion}
        className="bg-surface border border-border rounded-xl p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Nombre de la tarifa
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Cargo fijo
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={cargoFijo}
              onChange={(e) => setCargoFijo(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Fondo de reposición ($/m³)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorFondoReposicion}
              onChange={(e) => setValorFondoReposicion(Number(e.target.value))}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Vigente desde
            </label>
            <input
              type="date"
              value={vigenteDesde}
              onChange={(e) => setVigenteDesde(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-text">
              Tramos
            </label>
            <button
              type="button"
              onClick={agregarTramo}
              className="text-xs font-medium text-primary-dark hover:underline"
            >
              + Agregar tramo
            </button>
          </div>

          <div className="space-y-3">
            {tramos.map((tramo, index) => (
              <div
                key={index}
                className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 items-end bg-bg border border-border rounded-lg p-3"
              >
                <div className="text-xs font-medium text-muted pt-2">
                  Tramo {tramo.numero_tramo}
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">
                    Desde (m³)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tramo.desde_m3}
                    onChange={(e) =>
                      handleTramoChange(index, "desde_m3", e.target.value)
                    }
                    disabled={index === 0}
                    required
                    className="w-full px-2 py-1.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-gray-100 disabled:text-muted"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">
                    Hasta (m³, vacío = sin límite)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tramo.hasta_m3 ?? ""}
                    onChange={(e) =>
                      handleTramoChange(index, "hasta_m3", e.target.value)
                    }
                    className="w-full px-2 py-1.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1">
                    Precio por m³
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tramo.precio_m3}
                    onChange={(e) =>
                      handleTramoChange(index, "precio_m3", e.target.value)
                    }
                    required
                    className="w-full px-2 py-1.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => quitarTramo(index)}
                  disabled={tramos.length === 1}
                  className="text-xs text-red-600 hover:underline pb-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/tarifas")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Guardar tarifa
          </button>
        </div>
      </form>

      {mostrarConfirmacion && (
        <ConfirmDialog
          title="¿Confirmas ingresar esta tarifa?"
          description="Revisa los datos antes de guardar. Recuerda que las tarifas no se pueden editar después."
          confirmLabel="Sí, ingresar tarifa"
          cancelLabel="Revisar de nuevo"
          loading={guardando}
          error={error}
          onConfirm={handleConfirmarGuardado}
          onCancel={() => setMostrarConfirmacion(false)}
        >
          <div className="bg-bg border border-border rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-text">{nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cargo fijo</span>
              <span className="font-medium text-text">
                {formatoCLP(cargoFijo)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fondo de reposición</span>
              <span className="font-medium text-text">
                {formatoCLP(valorFondoReposicion)} / m³
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Vigente desde</span>
              <span className="font-medium text-text">{vigenteDesde}</span>
            </div>

            <div className="border-t border-border pt-3">
              <span className="text-muted block mb-2">Tramos</span>
              <div className="space-y-1">
                {tramos.map((t) => (
                  <div
                    key={t.numero_tramo}
                    className="flex justify-between text-xs"
                  >
                    <span className="text-muted">
                      Tramo {t.numero_tramo}: {t.desde_m3}–{t.hasta_m3 ?? "∞"}{" "}
                      m³
                    </span>
                    <span className="font-medium text-text">
                      {formatoCLP(t.precio_m3)} / m³
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
