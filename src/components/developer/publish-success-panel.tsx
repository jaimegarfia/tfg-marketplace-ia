"use client";

import { CheckCircle2, History, LayoutGrid, PlusCircle } from "lucide-react";
import type { PublishAssetResult } from "@/lib/developer-publish";
import { VerifiedPermissionsScope } from "@/components/verified-permissions-scope";

interface PublishSuccessPanelProps {
  result: PublishAssetResult;
  title?: string;
  description?: string;
}

export function PublishSuccessPanel({
  result,
  title = "Activo publicado con éxito",
  description,
}: PublishSuccessPanelProps) {
  return (
    <div className="space-y-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2
          size={22}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-emerald-400/90"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-neutral-50">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-400">
            {description ?? (
              <>
                <strong className="font-medium text-neutral-200">
                  {result.nombre}
                </strong>{" "}
                ha superado la auditoría Zero Trust. Revisa los logs abajo y, a
                continuación, documenta la guía de despliegue (obligatoria) para
                publicar en el marketplace.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-500/15 bg-neutral-950/40 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Veredicto
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-emerald-300/90">
            PASS
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/15 bg-neutral-950/40 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Vulnerabilidades
          </p>
          <p className="mt-1 font-mono text-sm text-neutral-200">
            {result.vulnerabilidadesDetectadas}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-500/15 bg-neutral-950/40 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Fecha auditoría
          </p>
          <p className="mt-1 text-xs text-neutral-300">
            {new Date(result.fechaEjecucion).toLocaleString("es-ES")}
          </p>
        </div>
      </div>

      {result.permisosAprobados && (
        <VerifiedPermissionsScope
          permisos={result.permisosAprobados}
          embedded
        />
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
          Logs del sandbox
        </p>
        <pre className="max-h-80 overflow-auto rounded-lg border border-neutral-800/60 bg-neutral-900/50 p-4 font-mono text-[11px] leading-relaxed text-neutral-400">
          {result.logsSandbox}
        </pre>
      </div>

    </div>
  );
}

interface PublishSuccessActionsProps {
  onViewSummary: () => void;
  onPublishAnother: () => void;
}

export function PublishSuccessActions({
  onViewSummary,
  onPublishAnother,
}: PublishSuccessActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
      <button
        type="button"
        onClick={onViewSummary}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white"
      >
        <LayoutGrid size={15} strokeWidth={1.5} aria-hidden="true" />
        Ver en resumen del catálogo
      </button>
      <button
        type="button"
        onClick={onPublishAnother}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-900"
      >
        <PlusCircle size={15} strokeWidth={1.5} aria-hidden="true" />
        Publicar otro activo
      </button>
    </div>
  );
}

interface VersionSuccessActionsProps {
  onViewHistory: () => void;
  onNewUpdate: () => void;
}

export function VersionSuccessActions({
  onViewHistory,
  onNewUpdate,
}: VersionSuccessActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
      <button
        type="button"
        onClick={onViewHistory}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white"
      >
        <History size={15} strokeWidth={1.5} aria-hidden="true" />
        Ver historial de auditorías
      </button>
      <button
        type="button"
        onClick={onNewUpdate}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-900"
      >
        <PlusCircle size={15} strokeWidth={1.5} aria-hidden="true" />
        Publicar otra actualización
      </button>
    </div>
  );
}
