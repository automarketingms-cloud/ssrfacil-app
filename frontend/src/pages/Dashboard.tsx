import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  DollarSign,
  Droplet,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Plus,
  Gauge,
  BarChart3,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { obtenerResumenDashboard } from "../api/dashboard";
import type { ResumenDashboard } from "../types";

function periodoActual(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}`;
}

function formatearMonto(valor: number): string {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split("-");
  const nombres = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${nombres[parseInt(mes, 10) - 1]} ${anio}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerResumenDashboard(periodoActual());
        setResumen(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el dashboard",
        );
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">Cargando dashboard...</p>;
  }

  if (error || !resumen) {
    return (
      <div className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-lg px-3 py-2">
        {error ?? "No se pudo cargar el dashboard"}
      </div>
    );
  }

  const datosGrafico = resumen.facturacion_ultimos_6_meses.map((m) => ({
    periodo: formatearPeriodo(m.periodo),
    facturado: m.facturado,
    cobrado: m.cobrado,
  }));

  const alertas = [
    resumen.reclamos_fuera_de_plazo > 0 && {
      texto: `${resumen.reclamos_fuera_de_plazo} reclamo(s) fuera de plazo`,
      color: "text-danger",
    },
    resumen.cortes_activos > 0 && {
      texto: `${resumen.cortes_activos} corte(s) sin reposición`,
      color: "text-danger",
    },
    resumen.medidores_sin_lectura > 0 && {
      texto: `${resumen.medidores_sin_lectura} medidor(es) sin lectura este período`,
      color: "text-amber-600",
    },
    resumen.clientes_con_subsidio > 0 && {
      texto: `${resumen.clientes_con_subsidio} cliente(s) con subsidio activo`,
      color: "text-primary-dark",
    },
    resumen.clientes_morosos > 0 && {
      texto: `${resumen.clientes_morosos} cliente(s) moroso(s) (factura vencida)`,
      color: "text-danger",
    },
  ].filter(Boolean) as { texto: string; color: string }[];

  const accionesRapidas = [
    { label: "Nueva Lectura", icon: Droplet, to: "/lecturas" },
    { label: "Nuevo Cliente", icon: Plus, to: "/clientes/nuevo" },
    { label: "Registrar Corte", icon: Wrench, to: "/continuidad" },
    { label: "Ver Reportes", icon: FileText, to: "/reportes" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <p className="text-sm text-muted">
          Resumen del período {formatearPeriodo(resumen.periodo)}
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <TarjetaKpi
          icon={Users}
          iconBg="bg-primary-light"
          iconColor="text-primary-dark"
          label="Clientes Activos"
          valor={resumen.clientes_activos.toString()}
          subtexto={`${resumen.socios_activos} socios`}
        />
        <TarjetaKpi
          icon={DollarSign}
          iconBg="bg-success-soft"
          iconColor="text-success"
          label="Facturación del Mes"
          valor={formatearMonto(resumen.facturacion_total_mes)}
        />

        <TarjetaKpi
          icon={Gauge}
          iconBg="bg-primary-light"
          iconColor="text-primary-dark"
          label="Agua Consumida"
          valor={`${resumen.consumo_total_m3} m³`}
        />
        <TarjetaKpi
          icon={ClipboardCheck}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          label="Lecturas Realizadas"
          valor={`${resumen.lecturas_realizadas} / ${resumen.clientes_activos}`}
        />
        <TarjetaKpi
          icon={DollarSign}
          iconBg="bg-danger-soft"
          iconColor="text-danger"
          label="Pendiente de Cobro"
          valor={formatearMonto(resumen.monto_pendiente_cobro)}
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <TarjetaKpi
          icon={AlertTriangle}
          iconBg="bg-danger-soft"
          iconColor="text-danger"
          label="Reclamos Abiertos"
          valor={resumen.reclamos_abiertos.toString()}
          subtexto={
            resumen.reclamos_fuera_de_plazo > 0
              ? `${resumen.reclamos_fuera_de_plazo} fuera de plazo`
              : undefined
          }
        />
        <TarjetaKpi
          icon={Wrench}
          iconBg="bg-danger-soft"
          iconColor="text-danger"
          label="Cortes Activos"
          valor={resumen.cortes_activos.toString()}
          subtexto="sin reposición"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Acciones rápidas */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text mb-3">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {accionesRapidas.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="flex flex-col items-center gap-2 border border-border rounded-lg py-4 hover:bg-primary-light/40 transition-colors"
                >
                  <Icon size={20} className="text-primary-dark" />
                  <span className="text-xs font-medium text-text text-center">
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-surface border border-border rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-primary-dark" />
            <h2 className="text-sm font-semibold text-text">
              Facturación — Últimos 6 Meses
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosGrafico}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis dataKey="periodo" fontSize={12} />
              <YAxis
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v: number) => formatearMonto(v)} />
              <Legend />
              <Bar
                dataKey="facturado"
                name="Facturado"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cobrado"
                name="Cobrado"
                fill="var(--color-success)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 mt-4">
          <h2 className="text-sm font-semibold text-text mb-3">Alertas</h2>
          <ul className="flex flex-col gap-2">
            {alertas.map((a, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 text-sm ${a.color}`}
              >
                <AlertTriangle size={14} />
                {a.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TarjetaKpi({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  valor,
  subtexto,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  valor: string;
  subtexto?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`${iconBg} ${iconColor} p-2.5 rounded-lg`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted mb-1">{label}</p>
        <p className="text-xl font-semibold text-text">{valor}</p>
        {subtexto && <p className="text-xs text-muted mt-0.5">{subtexto}</p>}
      </div>
    </div>
  );
}
