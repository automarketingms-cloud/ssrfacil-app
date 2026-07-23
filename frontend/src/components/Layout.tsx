import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/clientes", label: "Clientes" },
  { to: "/lecturas", label: "Ingresar Lectura" },
  { to: "/consumo", label: "Ver Consumo" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-surface border-r border-border p-6 flex flex-col gap-2">
        <h1 className="text-lg font-semibold text-text mb-6">SSRFacil</h1>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-light text-primary-dark"
                  : "text-muted hover:bg-bg hover:text-text"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
