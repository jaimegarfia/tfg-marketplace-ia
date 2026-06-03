"use client";

import { X } from "lucide-react";
import type { DeveloperAgenteRow } from "@/lib/developer-dashboard";

interface SandboxLogsModalProps {
  agente: DeveloperAgenteRow;
  onClose: () => void;
}

export function SandboxLogsModal({ agente, onClose }: SandboxLogsModalProps) {
  const logs =
    agente.logs_sandbox?.trim() ||
    "Sin logs de sandbox disponibles para este activo rechazado.";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Logs de auditoría — ${agente.nombre}`}
        className="
          relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col
          rounded-t-2xl border border-neutral-800/80 bg-[#0b0d10]
          shadow-2xl shadow-black/50 animate-fade-up
          sm:max-h-[85vh] sm:rounded-2xl
        "
      >
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              Diagnóstico de rechazo
            </p>
            <h2 className="mt-1 text-lg font-medium tracking-tight text-neutral-100">
              {agente.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-300"
          >
            <X size={16} strokeWidth={1.25} />
          </button>
        </div>

        <div className="drawer-scroll flex-1 overflow-y-auto px-6 py-6">
          <div className="rounded-lg border border-neutral-800/60 bg-neutral-900/50 p-4">
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-400">
              {logs}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
