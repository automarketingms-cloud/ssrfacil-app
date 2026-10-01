interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  error?: string;
}

export default function Textarea({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 3,
  error,
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-text">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className={`campo w-full ${error ? "campo-error" : ""}`}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
