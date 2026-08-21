export default function GaugeCircular({
  porcentaje,
  tamano = 140,
  label,
}: {
  porcentaje: number;
  tamano?: number;
  label?: string;
}) {
  const grosor = tamano * 0.08;
  const radio = tamano / 2 - grosor;
  const circunferencia = 2 * Math.PI * radio;
  const porcentajeClamp = Math.min(100, Math.max(0, Math.abs(porcentaje)));
  const offset = circunferencia - (porcentajeClamp / 100) * circunferencia;

  const color =
    porcentaje > 25 ? "#dc2626" : porcentaje > 15 ? "#f59e0b" : "#16a34a";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`}>
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={grosor}
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={tamano * 0.16}
          fontWeight="600"
          fill="#111827"
        >
          {porcentaje.toFixed(1)}%
        </text>
      </svg>
      {label && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
}
