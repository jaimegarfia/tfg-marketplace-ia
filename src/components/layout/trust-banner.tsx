const TRUST_MARKERS = [
  "100% ACID",
  "Sandbox certificado",
  "Firma de integridad",
] as const;

export function TrustBanner() {
  return (
    <div
      className="border-b border-neutral-800/40 bg-neutral-950/30"
      aria-label="Garantías de la plataforma"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        {TRUST_MARKERS.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/85" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
