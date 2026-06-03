"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import type { DeveloperAgenteRow } from "@/lib/developer-dashboard";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";
import { AuditBadge } from "@/components/audit-badge";
import { SandboxLogsModal } from "@/components/developer/sandbox-logs-modal";

interface TabAssetsProps {
  agentes: DeveloperAgenteRow[];
  onPublishClick: () => void;
}

export function TabAssets({ agentes, onPublishClick }: TabAssetsProps) {
  const [logsAgent, setLogsAgent] = useState<DeveloperAgenteRow | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
            Mis activos publicados
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Catálogo, precios y estado de auditoría en sandbox.
          </p>
        </div>
        <button
          type="button"
          onClick={onPublishClick}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-2 text-xs font-medium text-emerald-300/90 transition hover:border-emerald-500/45 hover:bg-emerald-500/10"
        >
          <PlusCircle size={14} strokeWidth={1.5} aria-hidden="true" />
          Publicar nuevo activo
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/30">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800/80 bg-neutral-950/50">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Nombre
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Versión
                </th>
                <th className="hidden px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-neutral-500 md:table-cell">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Precio
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Auditoría
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {agentes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-neutral-500"
                  >
                    Todavía no has publicado activos. Usa{" "}
                    <button
                      type="button"
                      onClick={onPublishClick}
                      className="text-emerald-300/90 underline-offset-2 hover:underline"
                    >
                      Publicar nuevo activo
                    </button>{" "}
                    para enviar tu primer agente a auditoría.
                  </td>
                </tr>
              ) : (
                agentes.map((agente) => (
                  <tr
                    key={agente.id}
                    className="transition-colors hover:bg-neutral-900/30"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-100">
                      {agente.nombre}
                      <span className="mt-0.5 block text-xs text-neutral-500 md:hidden">
                        {etiquetaTipoActivo(agente.tipo_activo)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                      v{agente.version}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-neutral-400 md:table-cell">
                      {etiquetaTipoActivo(agente.tipo_activo)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-neutral-300">
                      {formatearPrecio(agente.precio_usd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            agente.estado_auditoria === "en_auditoria"
                              ? "animate-pulse"
                              : undefined
                          }
                        >
                          <AuditBadge estado={agente.estado_auditoria} />
                        </span>
                        {agente.estado_auditoria === "rechazado" && (
                          <button
                            type="button"
                            onClick={() => setLogsAgent(agente)}
                            className="text-xs text-neutral-400 transition hover:text-neutral-200"
                          >
                            Ver logs
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {logsAgent && (
        <SandboxLogsModal agente={logsAgent} onClose={() => setLogsAgent(null)} />
      )}
    </div>
  );
}
