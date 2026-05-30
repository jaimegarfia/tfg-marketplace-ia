import { Boxes, FileCode2, Fingerprint } from "lucide-react";
import type { Agente } from "@/types/database";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";
import { AuditBadge } from "@/components/audit-badge";

interface AgentCardProps {
  agente: Agente;
}

export function AgentCard({ agente }: AgentCardProps) {
  const TipoIcon =
    agente.tipo_activo === "runtime_artifact" ? FileCode2 : Boxes;
  const verificado = agente.estado_auditoria === "certificado";

  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-[var(--surface)] p-5 shadow-zen transition-all duration-300 hover:-translate-y-0.5 hover:border-mint-200 hover:shadow-lg">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 ring-1 ring-inset ring-[var(--border)] dark:bg-stone-800 dark:text-stone-300">
            <TipoIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {agente.nombre}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {etiquetaTipoActivo(agente.tipo_activo)} · v{agente.version}
            </p>
          </div>
        </div>
        <AuditBadge estado={agente.estado_auditoria} />
      </header>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--muted)]">
        {agente.descripcion}
      </p>

      <footer className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
        <span className="text-sm font-semibold">
          {formatearPrecio(agente.precio_usd)}
        </span>
        {verificado ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-mint-700 dark:text-mint-400">
            <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
            Integridad verificada
          </span>
        ) : (
          <span className="text-xs text-[var(--muted)]">
            Sin firma de integridad
          </span>
        )}
      </footer>
    </article>
  );
}
