"use client";

const CERTIFICATION_PHASES = [
  "Generando identificador único de activo...",
  "Instanciando jaula de aislamiento efímera en Docker (node:18-alpine)...",
  "Configurando políticas estrictas de red (egreso deshabilitado)...",
  "Ejecutando analizador estático contra patrones de vulnerabilidades...",
  "Generando huella criptográfica SHA-256 e insertando registros atómicos en Neon...",
] as const;

export const CERTIFICATION_PHASE_MS = 200;

export async function runCertificationPhases(
  onPhase: (index: number) => void,
): Promise<void> {
  for (let index = 0; index < CERTIFICATION_PHASES.length; index += 1) {
    onPhase(index);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, CERTIFICATION_PHASE_MS);
    });
  }
}

interface CertificationOverlayProps {
  phaseIndex: number;
  title?: string;
}

export function CertificationOverlay({
  phaseIndex,
  title = "Motor de certificación Zero Trust",
}: CertificationOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certification-overlay-title"
      aria-live="polite"
      className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/90 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-xl border border-neutral-800/80 bg-neutral-950 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-neutral-700 border-t-emerald-400"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p
              id="certification-overlay-title"
              className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80"
            >
              {title}
            </p>
            <p
              key={phaseIndex}
              className="mt-2 animate-fade-up text-sm leading-relaxed text-neutral-200"
            >
              {CERTIFICATION_PHASES[phaseIndex]}
            </p>
          </div>
        </div>
        <div
          className="mt-5 flex gap-1.5"
          aria-label={`Fase ${phaseIndex + 1} de ${CERTIFICATION_PHASES.length}`}
        >
          {CERTIFICATION_PHASES.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                index <= phaseIndex ? "bg-emerald-500/80" : "bg-neutral-800"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
