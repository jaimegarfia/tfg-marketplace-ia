"use client";

import { useState, useMemo } from "react";
import { Shield } from "lucide-react";
import type { AgenteConAuditoria, EstadoAuditoria } from "@/types/database";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";
import { FilterTabs, type FilterValue } from "@/components/filter-tabs";
import { AgentDrawer } from "@/components/agent-drawer";

/* ── Visual mapping (moved from server page.tsx) ────────────────────── */

function estadoVisual(estado: EstadoAuditoria): {
  label: string;
  dot: string;
  text: string;
} {
  switch (estado) {
    case "certificado":
      return {
        label: "Certificado",
        dot: "bg-emerald-400/90",
        text: "text-emerald-400/90",
      };
    case "en_auditoria":
      return {
        label: "En auditoría",
        dot: "bg-amber-400/80",
        text: "text-amber-400/80",
      };
    case "borrador":
      return {
        label: "Borrador",
        dot: "bg-neutral-600",
        text: "text-neutral-400",
      };
    case "rechazado":
      return {
        label: "Rechazado",
        dot: "bg-red-400/60",
        text: "text-red-400/60",
      };
  }
}

/* ── Interactive row ────────────────────────────────────────────────── */

interface AgentRowProps {
  agente: AgenteConAuditoria;
  index: number;
  onSelect: (agente: AgenteConAuditoria) => void;
}

function AgentRow({ agente, index, onSelect }: AgentRowProps) {
  const estado = estadoVisual(agente.estado_auditoria);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onSelect(agente)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(agente);
        }
      }}
      className="
        group cursor-pointer border-b border-neutral-800/80 py-8
        transition-all duration-300
        hover:border-neutral-600/70 hover:bg-white/[0.015]
        focus-visible:outline-none focus-visible:ring-1
        focus-visible:ring-neutral-600 focus-visible:ring-offset-2
        focus-visible:ring-offset-[#0b0d10]
      "
    >
      <article className="grid grid-cols-1 gap-5 md:grid-cols-[1.6fr_0.6fr_0.6fr] md:items-start">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            {(index + 1).toString().padStart(2, "0")} ·{" "}
            {etiquetaTipoActivo(agente.tipo_activo)}
          </p>
          <h3
            className="
              text-3xl font-medium tracking-tight text-neutral-100
              transition-colors duration-300 group-hover:text-white
              sm:text-4xl
            "
          >
            {agente.nombre}
          </h3>
          <p
            className="
              max-w-2xl text-pretty text-base leading-relaxed text-neutral-400
              transition-colors duration-300 group-hover:text-neutral-300
            "
          >
            {agente.descripcion}
          </p>
        </div>

        <div className="space-y-2 md:pt-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Precio
          </p>
          <p className="text-xl font-medium tracking-tight text-neutral-100">
            {formatearPrecio(agente.precio_usd)}
          </p>
        </div>

        <div className="space-y-2 md:pt-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Estado
          </p>
          <p className={`inline-flex items-center gap-2 text-sm ${estado.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
            {estado.label}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-600">
            v{agente.version}
          </p>
        </div>

        {/* Subtle arrow hint on hover */}
        <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
          <Shield
            size={14}
            strokeWidth={1}
            className="text-neutral-800 transition-all duration-300 group-hover:text-neutral-500"
            aria-hidden="true"
          />
        </div>
      </article>
    </li>
  );
}

/* ── Catalog orchestrator ───────────────────────────────────────────── */

interface CatalogClientProps {
  agentes: AgenteConAuditoria[];
}

export function CatalogClient({ agentes }: CatalogClientProps) {
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [selectedAgent, setSelectedAgent] = useState<AgenteConAuditoria | null>(
    null,
  );

  const filtered = useMemo(() => {
    if (filter === "todos") return agentes;
    return agentes.filter((a) => a.tipo_activo === filter);
  }, [agentes, filter]);

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-8">
        <FilterTabs active={filter} onChange={setFilter} />
      </div>

      {/* Agent list */}
      {filtered.length > 0 ? (
        <ul className="divide-y divide-transparent">
          {filtered.map((agente, index) => (
            <AgentRow
              key={agente.id}
              agente={agente}
              index={index}
              onSelect={setSelectedAgent}
            />
          ))}
        </ul>
      ) : (
        <div className="border-b border-neutral-800/80 py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Sin resultados
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            No hay agentes de este tipo en el catálogo.
          </p>
        </div>
      )}

      {/* Results count */}
      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
          {filtered.length} {filtered.length === 1 ? "agente" : "agentes"}
          {filter !== "todos" && " filtrados"}
        </p>
      </div>

      {/* Drawer */}
      <AgentDrawer
        agente={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
