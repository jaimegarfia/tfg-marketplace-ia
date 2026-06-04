import Link from "next/link";

interface TermsAcceptanceProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function TermsAcceptance({
  checked,
  onChange,
  disabled = false,
  id = "accept-terms",
}: TermsAcceptanceProps) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-0"
      />
      <span className="text-xs leading-relaxed text-zinc-400">
        Acepto los{" "}
        <Link
          href="/legal/terminos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-300 underline-offset-2 hover:text-zinc-100 hover:underline"
        >
          términos de servicio
        </Link>{" "}
        y la{" "}
        <Link
          href="/legal/privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-300 underline-offset-2 hover:text-zinc-100 hover:underline"
        >
          política de privacidad
        </Link>
        .
      </span>
    </label>
  );
}
