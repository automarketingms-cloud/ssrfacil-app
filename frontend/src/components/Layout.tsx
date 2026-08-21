import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Receipt,
  Droplet,
  History,
  Gauge,
  Wrench,
  BarChart3,
  FileText,
  MessageSquare,
  ClipboardList,
  MapPin,
  ReceiptText,
  DollarSign,
  Settings,
  TrendingDown,
  ChevronDown,
} from "lucide-react";

const navSueltos = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/tarifas", label: "Tarifas", icon: Receipt },
  { to: "/reclamos", label: "Reclamos", icon: MessageSquare },
];

const navGrupos = [
  {
    label: "Terreno",
    items: [
      { to: "/lecturas", label: "Ingresar Lectura", icon: Droplet },
      { to: "/presion", label: "Registrar Presión", icon: Gauge },
      {
        to: "/continuidad",
        label: "Registrar Corte y/o reposicion",
        icon: Wrench,
      },
      { to: "/lectura-matriz", label: "Lectura Matriz", icon: Droplet },
      { to: "/lecturas/ruta", label: "Ruta de Lectura", icon: MapPin },
    ],
  },
  {
    label: "Lecturas",
    items: [
      {
        to: "/lecturas/historial",
        label: "Historial de Lecturas",
        icon: History,
      },
      {
        to: "/lectura-matriz/historial",
        label: "Historial Lectura Matriz",
        icon: History,
      },
    ],
  },
  {
    label: "Facturación",
    items: [
      { to: "/consumo", label: "Ver Consumo", icon: BarChart3 },
      { to: "/resumen", label: "Resumen Mensual", icon: FileText },
      { to: "/facturas", label: "Facturación", icon: ReceiptText },
      { to: "/pagos", label: "Registrar Pago", icon: DollarSign },
    ],
  },
  {
    label: "Reportes",
    items: [
      { to: "/reportes", label: "Reportes SISS", icon: ClipboardList },
      {
        to: "/reportes-internos",
        label: "Reportes Internos",
        icon: TrendingDown,
      },
    ],
  },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary text-white"
      : "text-slate-300 hover:bg-navy-light hover:text-white"
  }`;
}

export default function Layout() {
  const location = useLocation();

  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(() => {
    const grupoActivo = navGrupos.find((g) =>
      g.items.some((item) => item.to === location.pathname),
    );
    return new Set(grupoActivo ? [grupoActivo.label] : []);
  });

  function toggleGrupo(label: string) {
    setGruposAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 h-screen sticky top-0 bg-navy pt-2 px-6 pb-6 flex flex-col gap-1">
        <div className="mb-0 flex items-start justify-start shrink-0">
          <img
            src="/logo.png"
            alt="APR Fácil"
            className="h-[168px] w-auto block"
          />
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0 sidebar-nav">
          {navSueltos.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}

          <div className="h-px bg-navy-light my-2" />

          {navGrupos.map((grupo) => {
            const abierto = gruposAbiertos.has(grupo.label);
            const grupoActivo = grupo.items.some(
              (item) => item.to === location.pathname,
            );
            return (
              <div key={grupo.label}>
                <button
                  onClick={() => toggleGrupo(grupo.label)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                    grupoActivo
                      ? "text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {grupo.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${abierto ? "rotate-180" : ""}`}
                  />
                </button>
                {abierto && (
                  <div className="flex flex-col gap-1 mt-1 mb-1">
                    {grupo.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={linkClass}
                        >
                          <Icon size={18} />
                          {item.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-navy-light hover:text-white"
            }`
          }
        >
          <Settings size={18} />
          Configuración
        </NavLink>
      </aside>
      <main className="flex-1 p-8 bg-bg">
        <Outlet />
      </main>
    </div>
  );
}
