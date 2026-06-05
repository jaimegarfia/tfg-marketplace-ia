"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { AuditFailureKind } from "@/lib/audit-types";
import type { ApprovedPermissions } from "@/lib/audit-types";
import {
  extractSandboxFailureReasons,
  getInfrastructureFailureHint,
} from "@/lib/sandbox-log-parse";
import { VerifiedPermissionsScope } from "@/components/verified-permissions-scope";

export interface AuditResultView {
  nombre: string;
  resultadoGlobal: boolean;
  failureKind: AuditFailureKind;
  vulnerabilidadesDetectadas: number;
  fechaEjecucion: string;
  hashIntegridad: string;
  logsSandbox: string;
  permisosAprobados: ApprovedPermissions | null;
}

interface PublishAuditResultPanelProps {
  result: AuditResultView;
  onRetry?: () => void;
  successTitle?: string;
  successDescription?: string;
  rejectDescription?: string;
}

export function PublishAuditResultPanel({
  result,
  onRetry,
  successTitle = "Activo certificado y publicado",
  successDescription,
  rejectDescription,
}: PublishAuditResultPanelProps) {
  const certified = result.resultadoGlobal;
  const infrastructureFailure = result.failureKind === "infrastructure";
  const failureReasons = certified
    ? []
    : extractSandboxFailureReasons(result.logsSandbox);
  const infraHint = infrastructureFailure
    ? getInfrastructureFailureHint(result.logsSandbox)
    : null;

  return (
    <div
      className={`space-y-4 rounded-xl border p-5 ${
        certified
          ? "border-neutral-800/80 bg-neutral-950/40"
          : "border-red-500/25 bg-red-500/[0.04]"
      }`}
    >
      <div className="flex items-start gap-3">
        {certified ? (
          <CheckCircle2
            size={20}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-emerald-400/90"
            aria-hidden="true"
          />
        ) : (
          <XCircle
            size={20}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-red-400/90"
            aria-hidden="true"
          />
        )}
        <div>
          <h3 className="text-base font-medium text-neutral-100">
            {certified
              ? successTitle
              : infrastructureFailure
                ? "No se pudo ejecutar la auditoría"
                : "Activo rechazado por el sandbox"}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {certified
              ? (successDescription ??
                `${result.nombre} ya está disponible en el marketplace.`)
              : infrastructureFailure
                ? "El fallo es del entorno (Docker/sandbox/Trivy), no de tu descriptor. La versión anterior sigue activa."
                : (rejectDescription ??
                  "Corrige la configuración técnica abajo y vuelve a enviar. La versión anterior sigue activa.")}
          </p>
        </div>
      </div>

      {!certified && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-red-400/80">
            {infrastructureFailure ? "Qué ha ocurrido" : "Por qué ha fallado"}
          </p>
          {infraHint && (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm leading-relaxed text-amber-100/90">
              {infraHint}
            </p>
          )}
          {failureReasons.length > 0 && (
            <ul className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-3 text-sm leading-relaxed text-red-200/90">
              {failureReasons.map((reason) => (
                <li key={reason} className="list-disc pl-4 marker:text-red-400/60">
                  {reason}
                </li>
              ))}
            </ul>
          )}
          {!infraHint && failureReasons.length === 0 && (
            <p className="text-sm text-neutral-400">
              Revisa los logs completos para localizar permisos de red, CVE en
              imagen o patrones no permitidos en el descriptor.
            </p>
          )}
          {onRetry && !infrastructureFailure && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-800"
            >
              Corregir y reintentar
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Veredicto
          </p>
          <p
            className={`mt-1 font-mono text-sm font-medium ${certified ? "text-emerald-300/90" : "text-red-300/90"}`}
          >
            {certified ? "PASS" : "FAIL"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Vulnerabilidades
          </p>
          <p className="mt-1 font-mono text-sm text-neutral-200">
            {infrastructureFailure && !certified
              ? "—"
              : result.vulnerabilidadesDetectadas}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Fecha auditoría
          </p>
          <p className="mt-1 text-xs text-neutral-300">
            {new Date(result.fechaEjecucion).toLocaleString("es-ES")}
          </p>
        </div>
      </div>

      {result.permisosAprobados && (
        <VerifiedPermissionsScope permisos={result.permisosAprobados} embedded />
      )}

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Hash de integridad
        </p>
        <p className="break-all rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3 py-2 font-mono text-[11px] text-neutral-400">
          SHA-256: {result.hashIntegridad}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Logs de auditoría
        </p>
        <pre
          className={`max-h-80 overflow-auto rounded-lg border p-4 font-mono text-[11px] leading-relaxed ${
            certified
              ? "border-neutral-800/60 bg-neutral-900/50 text-neutral-400"
              : "border-red-500/20 bg-neutral-950 text-neutral-300"
          }`}
        >
          {result.logsSandbox}
        </pre>
      </div>
    </div>
  );
}
