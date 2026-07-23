interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export default function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  error,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`px-3 py-2 rounded-lg border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? "border-red-400" : "border-border"
        }`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
