import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  UserCog,
  LogOut,
  Building2,
  Menu,
  X,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../types";

const navSueltos: {
  to: string;
  label: string;
  icon: typeof Home;
  roles: Rol[];
}[] = [
  {
    to: "/",
    label: "Inicio",
    icon: Home,
    roles: ["admin", "oficina", "terreno", "super_admin"],
  },
  {
    to: "/clientes",
    label: "Clientes",
    icon: Users,
    roles: ["admin", "oficina"],
  },
  {
    to: "/tarifas",
    label: "Tarifas",
    icon: Receipt,
    roles: ["admin", "oficina"],
  },
  {
    to: "/reclamos",
    label: "Reclamos",
    icon: MessageSquare,
    roles: ["admin", "oficina"],
  },
];

const navGrupos: {
  label: string;
  roles: Rol[];
  items: { to: string; label: string; icon: typeof Home }[];
}[] = [
  {
    label: "Terreno",
    roles: ["admin", "oficina", "terreno"],
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
    roles: ["admin", "oficina"],
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
    roles: ["admin", "oficina"],
    items: [
      { to: "/consumo", label: "Ver Consumo", icon: BarChart3 },
      { to: "/resumen", label: "Resumen Mensual", icon: FileText },
      { to: "/facturas", label: "Facturación", icon: ReceiptText },
      { to: "/caja", label: "Mi Caja", icon: Wallet },
      { to: "/pagos", label: "Registrar Pago", icon: DollarSign },
    ],
  },
  {
    label: "Reportes",
    roles: ["admin", "oficina"],
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

const ROLES_ADMIN = ["admin", "super_admin"];

const ROL_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  oficina: "Oficina",
  terreno: "Terreno",
};

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary text-white"
      : "text-slate-300 hover:bg-navy-light hover:text-white"
  }`;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

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

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleNavClick() {
    setMenuMovilAbierto(false);
  }

  const esAdmin = usuario ? ROLES_ADMIN.includes(usuario.rol) : false;
  const esSuperAdmin = usuario?.rol === "super_admin";

  const navSueltosVisibles = usuario
    ? navSueltos.filter((item) => item.roles.includes(usuario.rol))
    : [];

  const navGruposVisibles = usuario
    ? navGrupos.filter((grupo) => grupo.roles.includes(usuario.rol))
    : [];

  return (
    <div className="min-h-screen flex">
      {/* Overlay mobile: cierra el menú al tocar fuera */}
      {menuMovilAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMenuMovilAbierto(false)}
        />
      )}

      <aside
        className={`w-64 h-screen fixed lg:sticky top-0 pt-2 px-6 pb-6 flex flex-col gap-1 bg-navy z-40 transition-transform duration-200 ${
          menuMovilAbierto ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="mb-0 flex items-start justify-between lg:justify-start shrink-0">
          <img
            src="/logo.png"
            alt="APR Fácil"
            className="h-24 lg:h-[168px] w-auto block"
          />
          <button
            onClick={() => setMenuMovilAbierto(false)}
            className="lg:hidden text-slate-300 hover:text-white p-1 mt-2"
          >
            <X size={22} />
          </button>
        </div>

        <nav
          onClick={handleNavClick}
          className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0 sidebar-nav"
        >
          {navSueltosVisibles.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}

          {esAdmin && (
            <NavLink to="/usuarios" className={linkClass}>
              <UserCog size={18} />
              Usuarios
            </NavLink>
          )}

          {usuario?.rol === "admin" && (
            <NavLink to="/cajas-empresa" className={linkClass}>
              <Wallet size={18} />
              Gestión de Cajas
            </NavLink>
          )}

          {esSuperAdmin && (
            <NavLink to="/empresas/nueva" className={linkClass}>
              <Building2 size={18} />
              Crear Empresa
            </NavLink>
          )}

          <div className="h-px bg-navy-light my-2" />

          {navGruposVisibles.map((grupo) => {
            const abierto = gruposAbiertos.has(grupo.label);
            const grupoActivo = grupo.items.some(
              (item) => item.to === location.pathname,
            );
            return (
              <div key={grupo.label}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGrupo(grupo.label);
                  }}
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

        {esAdmin && (
          <NavLink
            to="/configuracion"
            onClick={handleNavClick}
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
        )}

        {usuario && (
          <div className="shrink-0 border-t border-navy-light pt-3 mt-1">
            <NavLink
              to="/perfil"
              onClick={handleNavClick}
              className="px-4 py-1 block hover:bg-navy-light rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-white truncate">
                {usuario.nombre}
              </p>
              <p className="text-xs text-slate-400">
                {ROL_LABELS[usuario.rol] ?? usuario.rol}
              </p>
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-navy-light hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar solo mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-navy flex items-center justify-between px-4 py-1.5">
          <button
            onClick={() => setMenuMovilAbierto(true)}
            className="text-slate-300 hover:text-white p-1"
          >
            <Menu size={24} />
          </button>
          <img src="/logo.png" alt="APR Fácil" className="h-20 w-auto" />
          <div className="w-6" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
