"use client";

import { ShieldCheck, ShoppingCart } from "lucide-react";
import type { AgenteConAuditoria } from "@/types/database";
import {
  etiquetaCategoria,
  etiquetaTipoActivo,
  formatearPrecio,
} from "@/lib/catalog-format";
import { AgentCardRating } from "@/components/marketplace/agent-card-rating";
import { AssetCardVisual } from "@/components/marketplace/asset-card-visual";

interface AgentCardProps {
  agente: AgenteConAuditoria;
  onSelect: (agente: AgenteConAuditoria) => void;
  onAcquire?: (agente: AgenteConAuditoria) => void;
}

export function AgentCard({ agente, onSelect, onAcquire }: AgentCardProps) {
  const certificado = agente.estado_auditoria === "certificado";
  const estudio =
    agente.desarrollador_nombre?.trim() || null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-800/80 bg-[var(--surface)] transition hover:border-neutral-600/70 hover:shadow-lg hover:shadow-black/20">
      <button
        type="button"
        onClick={() => onSelect(agente)}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d10]"
      >
        <div className="relative">
          <AssetCardVisual
            imagenUrl={agente.imagen_url}
            categoria={agente.categoria}
          />
          {certificado && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-emerald-950/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300/90 backdrop-blur-sm">
              <ShieldCheck size={10} aria-hidden="true" />
              Certificado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">
              {etiquetaCategoria(agente.categoria)} ·{" "}
              {etiquetaTipoActivo(agente.tipo_activo)}
            </p>
            {agente.admite_adaptacion ? (
              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-emerald-300/90">
                Adaptación
              </span>
            ) : (
              <span className="rounded border border-neutral-700/60 px-1.5 py-px text-[9px] uppercase tracking-wide text-neutral-600">
                Sin adaptación
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-neutral-100 group-hover:text-white">
            {agente.nombre}
          </h3>

          <AgentCardRating
            ratingPromedio={agente.rating_promedio}
            numValoraciones={agente.num_valoraciones}
          />

          {estudio && (
            <p className="mt-1 text-xs text-neutral-500">por {estudio}</p>
          )}

          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-neutral-500">
            {agente.descripcion}
          </p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-neutral-100">
              {formatearPrecio(agente.precio_eur)}
            </span>
            <span className="text-[10px] text-neutral-600">v{agente.version}</span>
          </div>
        </div>
      </button>

      <div className="flex gap-2 border-t border-neutral-800/60 p-2 sm:p-3">
        <button
          type="button"
          onClick={() => onSelect(agente)}
          className="flex-1 rounded-md border border-neutral-700/80 px-2 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-900"
        >
          Ver detalle
        </button>
        <button
          type="button"
          onClick={() => onAcquire?.(agente)}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-neutral-100 px-2 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-white"
        >
          <ShoppingCart size={12} aria-hidden="true" />
          Adquirir
        </button>
      </div>
    </article>
  );
}
