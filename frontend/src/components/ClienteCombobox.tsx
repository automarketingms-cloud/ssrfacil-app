import { useEffect, useRef, useState } from "react";
import type { Cliente } from "../types";

interface Props {
  clientes: Cliente[];
  value: string;
  onChange: (clienteId: string) => void;
  loading?: boolean;
}

export default function ClienteCombobox({
  clientes,
  value,
  onChange,
  loading,
}: Props) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const clienteSeleccionado = clientes.find((c) => String(c.id) === value);

  const filtrados = clientes.filter((c) => {
    const termino = texto.trim().toLowerCase();
    if (!termino) return true;
    return (
      c.rut.toLowerCase().includes(termino) ||
      c.nombre.toLowerCase().includes(termino)
    );
  });

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function seleccionar(cliente: Cliente) {
    onChange(String(cliente.id));
    setTexto(`${cliente.nombre} — ${cliente.rut}`);
    setAbierto(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!abierto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtrados[indiceActivo]) seleccionar(filtrados[indiceActivo]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedorRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-text">Cliente</label>
      <input
        type="text"
        value={
          abierto
            ? texto
            : clienteSeleccionado
              ? `${clienteSeleccionado.nombre} — ${clienteSeleccionado.rut}`
              : texto
        }
        onChange={(e) => {
          setTexto(e.target.value);
          setIndiceActivo(0);
          if (!abierto) setAbierto(true);
          if (value) onChange("");
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={handleKeyDown}
        placeholder={
          loading ? "Cargando clientes..." : "Escribe nombre o RUT..."
        }
        disabled={loading}
        className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {abierto && !loading && (
        <div className="absolute top-full mt-1 w-full bg-white border border-border rounded-lg shadow-md max-h-56 overflow-y-auto z-10">
          {filtrados.length === 0 ? (
            <p className="text-sm text-muted px-3 py-2">Sin resultados</p>
          ) : (
            filtrados.map((c, i) => (
              <button
                type="button"
                key={c.id}
                onClick={() => seleccionar(c)}
                onMouseEnter={() => setIndiceActivo(i)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  i === indiceActivo
                    ? "bg-primary-light/50 text-primary-dark"
                    : "text-text hover:bg-gray-50"
                }`}
              >
                {c.nombre} — {c.rut}
                <span className="block text-xs text-muted">
                  Medidor {c.numero_medidor}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
