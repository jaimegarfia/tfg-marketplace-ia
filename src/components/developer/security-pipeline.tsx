import { Box, Fingerprint, ScanLine, ShieldX, Workflow } from "lucide-react";

const PIPELINE_STEPS = [
  {
    icon: Fingerprint,
    title: "Huella SHA-256",
    detail: "Se calcula el hash de integridad del descriptor enviado.",
  },
  {
    icon: Box,
    title: "Contenedor aislado",
    detail: "docker run --network none -m 128m · sin egreso ni acceso al host.",
  },
  {
    icon: ScanLine,
    title: "Análisis estático / Trivy",
    detail:
      "Workflows: escaneo de patrones en JSON. Contenedores: CVE CRITICAL/HIGH con Trivy.",
  },
  {
    icon: ShieldX,
    title: "Veredicto Zero Trust",
    detail: "0 hallazgos bloqueantes → certificado. Cualquier riesgo → rechazado.",
  },
] as const;

interface SecurityPipelineProps {
  compact?: boolean;
}

export function SecurityPipeline({ compact = false }: SecurityPipelineProps) {
  return (
    <div
      className={`rounded-xl border border-neutral-800/80 bg-neutral-950/30 ${compact ? "p-3" : "p-5"}`}
    >
      <div className="flex items-center gap-2">
        <Workflow
          size={15}
          strokeWidth={1.5}
          className="text-emerald-400/80"
          aria-hidden="true"
        />
        <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Pipeline de certificación Zero Trust
        </h3>
      </div>
      <div
        className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "gap-3 sm:grid-cols-2 lg:grid-cols-4"}`}
      >
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800/80 bg-neutral-950/60 text-emerald-400/80">
                  <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] text-neutral-600">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-neutral-200">
                {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                {step.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
