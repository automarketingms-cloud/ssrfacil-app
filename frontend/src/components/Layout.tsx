import { NavLink, Outlet } from "react-router-dom";
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
  ReceiptText,
  DollarSign,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/tarifas", label: "Tarifas", icon: Receipt },
  { to: "/lecturas", label: "Ingresar Lectura", icon: Droplet },
  { to: "/lecturas/historial", label: "Historial de Lecturas", icon: History },
  { to: "/presion", label: "Registrar Presión", icon: Gauge },
  { to: "/continuidad", label: "Registrar Corte y/o reposicion", icon: Wrench },
  { to: "/consumo", label: "Ver Consumo", icon: BarChart3 },
  { to: "/resumen", label: "Resumen Mensual", icon: FileText },
  { to: "/facturas", label: "Facturación", icon: ReceiptText },
  { to: "/pagos", label: "Registrar Pago", icon: DollarSign },
  { to: "/reclamos", label: "Reclamos", icon: MessageSquare },
  { to: "/reportes", label: "Reportes SISS", icon: ClipboardList },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-navy pt-2 px-6 pb-6 flex flex-col gap-1">
        <div className="mb-0 flex items-start justify-start">
          <img
            src="/logo.png"
            alt="APR Fácil"
            className="h-[168px] w-auto block"
          />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:bg-navy-light hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}

        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `mt-auto flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
