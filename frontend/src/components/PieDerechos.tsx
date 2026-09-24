export default function PieDerechos({
  className = "text-muted",
}: {
  className?: string;
}) {
  return (
    <p className={`text-xs text-center mt-6 ${className}`}>
      © {new Date().getFullYear()} SSR Fácil. Todos los derechos reservados.
    </p>
  );
}
