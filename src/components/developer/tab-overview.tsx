"use client";

import { useState } from "react";
import {
  BadgeCheck,
  DollarSign,
  Package,
  PlusCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  DeveloperAgenteRow,
  DeveloperMetrics,
} from "@/lib/developer-dashboard";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";
import { AuditBadge } from "@/components/audit-badge";
import { SandboxLogsModal } from "@/components/developer/sandbox-logs-modal";

interface TabOverviewProps {
  metrics: DeveloperMetrics;
  developerName: string;
  agentes: DeveloperAgenteRow[];
  onPublishClick: () => void;
  onSelectAsset: (agenteId: string) => void;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: "emerald" | "sky" | "neutral";
}

function MetricCard({ label, value, hint, icon: Icon, accent }: MetricCardProps) {
  const accents = {
    emerald: { icon: "text-emerald-400/80", value: "text-emerald-50" },
    sky: { icon: "text-sky-400/80", value: "text-sky-50" },
    neutral: { icon: "text-neutral-400", value: "text-neutral-50" },
  }[accent];

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-[var(--surface)] p-5 transition hover:border-neutral-700/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${accents.value}`}
          >
            {value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">{hint}</p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-800/80 bg-neutral-950/60 ${accents.icon}`}
        >
          <Icon size={18} strokeWidth={1.25} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function TabOverview({
  metrics,
  developerName,
  agentes,
  onPublishClick,
  onSelectAsset,
}: TabOverviewProps) {
  const [logsAgent, setLogsAgent] = useState<DeveloperAgenteRow | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
            Resumen del catálogo
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {developerName} · rendimiento e inventario de activos publicados.
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

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Ingresos totales (USD)"
          value={formatUsd(metrics.ingresosTotalesUsd)}
          hint="Suma de transacciones completadas sobre tus agentes."
          icon={DollarSign}
          accent="emerald"
        />
        <MetricCard
          label="Unidades distribuidas"
          value={String(metrics.unidadesDistribuidas)}
          hint="Licencias vendidas con pago confirmado."
          icon={Package}
          accent="sky"
        />
        <MetricCard
          label="Aceptación de sandbox"
          value={`${metrics.tasaAceptacionSandbox}%`}
          hint={`${metrics.agentesCertificados} de ${metrics.totalAgentes} activos certificados.`}
          icon={BadgeCheck}
          accent="neutral"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-neutral-200">
            Activos publicados
          </h3>
          <span className="text-xs text-neutral-500">
            {agentes.length} {agentes.length === 1 ? "activo" : "activos"} · clic
            para gestionar
          </span>
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
                  <th className="w-10 px-2 py-3" aria-hidden="true" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {agentes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
                      className="cursor-pointer transition-colors hover:bg-neutral-900/40"
                      onClick={() => onSelectAsset(agente.id)}
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
                      <td
                        className="px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
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
                      <td className="px-2 py-3 text-neutral-600">
                        <span className="text-xs" aria-hidden="true">
                          →
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {logsAgent && (
        <SandboxLogsModal agente={logsAgent} onClose={() => setLogsAgent(null)} />
      )}

    </div>
  );
}
