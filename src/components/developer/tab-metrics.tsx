"use client";

import { BadgeCheck, DollarSign, Package, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeveloperMetrics } from "@/lib/developer-dashboard";

interface TabMetricsProps {
  metrics: DeveloperMetrics;
  developerName: string;
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

export function TabMetrics({ metrics, developerName }: TabMetricsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
          Resumen de rendimiento
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {developerName} · métricas calculadas en tiempo real desde Neon.
        </p>
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

      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/30 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={18}
            strokeWidth={1.25}
            className="mt-0.5 shrink-0 text-emerald-400/80"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-200">
              Cómo se calculan estas métricas
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-neutral-500">
              <li>
                Ingresos: <span className="font-mono text-neutral-400">SUM(precio_usd)</span>{" "}
                de transacciones con estado <span className="font-mono">completado</span>.
              </li>
              <li>
                Unidades:{" "}
                <span className="font-mono text-neutral-400">COUNT(*)</span> de
                esas mismas transacciones.
              </li>
              <li>
                Aceptación: agentes <span className="font-mono">certificado</span>{" "}
                sobre el total de activos que has publicado.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
