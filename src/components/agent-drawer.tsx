"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  PencilLine,
  ArrowUpRight,
  Download,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type {
  AgenteConAuditoria,
  EstadoAuditoria,
  Vulnerabilidad,
} from "@/types/database";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";
import { getApprovedPermissionRows } from "@/lib/audit-permissions-ui";
import { useMockAuth } from "@/context/mock-auth-context";

/* ── Visual mappings ────────────────────────────────────────────────── */

interface AuditBadgeVisual {
  label: string;
  icon: LucideIcon;
  dot: string;
  text: string;
}

const AUDIT_VISUALS: Record<EstadoAuditoria, AuditBadgeVisual> = {
  certificado: {
    label: "Certificado",
    icon: ShieldCheck,
    dot: "bg-emerald-400/90",
    text: "text-emerald-400/90",
  },
  en_auditoria: {
    label: "En auditoría",
    icon: FlaskConical,
    dot: "bg-amber-400/80",
    text: "text-amber-400/80",
  },
  borrador: {
    label: "Borrador",
    icon: PencilLine,
    dot: "bg-neutral-500",
    text: "text-neutral-400",
  },
  rechazado: {
    label: "Rechazado",
    icon: ShieldAlert,
    dot: "bg-red-400/70",
    text: "text-red-400/70",
  },
};

/* ── Simulated log generation ───────────────────────────────────────── */

interface LogLine {
  tag: "PASS" | "FAIL" | "WARN" | "INFO";
  text: string;
}

function parseSandboxLogs(logsSandbox: string | undefined): LogLine[] {
  if (!logsSandbox?.trim()) {
    return [
      {
        tag: "INFO",
        text: "Sin logs de sandbox — el activo aún no ha sido auditado.",
      },
    ];
  }

  return logsSandbox.split("\n").map((line) => {
    if (line.includes("[PASS]")) return { tag: "PASS" as const, text: line };
    if (line.includes("[FAIL]")) return { tag: "FAIL" as const, text: line };
    if (line.includes("[WARN]")) return { tag: "WARN" as const, text: line };
    return { tag: "INFO" as const, text: line };
  });
}

function logTagColor(tag: LogLine["tag"]): string {
  switch (tag) {
    case "PASS":
      return "text-emerald-400/80";
    case "FAIL":
      return "text-red-400/70";
    case "WARN":
      return "text-amber-400/70";
    case "INFO":
      return "text-neutral-500";
  }
}

/* ── Vulnerability badge ────────────────────────────────────────────── */

function severityColor(sev: Vulnerabilidad["severidad"]): string {
  switch (sev) {
    case "critica":
      return "text-red-400/90 bg-red-400/10 border-red-400/20";
    case "alta":
      return "text-red-400/70 bg-red-400/[0.06] border-red-400/15";
    case "media":
      return "text-amber-400/70 bg-amber-400/[0.06] border-amber-400/15";
    case "baja":
      return "text-neutral-400 bg-neutral-400/[0.06] border-neutral-400/15";
  }
}

/* ── Component ──────────────────────────────────────────────────────── */

interface AgentDrawerProps {
  agente: AgenteConAuditoria | null;
  onClose: () => void;
}

export function AgentDrawer({ agente, onClose }: AgentDrawerProps) {
  const { user, openAuthModal } = useMockAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (agente) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [agente, handleEscape]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  const handleAcquire = useCallback(async () => {
    // Guard de autenticación: si es anónimo, abre modal de identidad.
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      setIsProcessing(true);
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 900);
      });
      showToast("Transacción simulada registrada correctamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [openAuthModal, showToast, user]);

  if (!agente) return null;

  const visual = AUDIT_VISUALS[agente.estado_auditoria];
  const AuditIcon = visual.icon;
  const logs = parseSandboxLogs(agente.auditoria?.logs_sandbox);
  const vulns = agente.auditoria?.vulnerabilidades_detectadas ?? [];
  const vulnCount =
    agente.auditoria?.vulnerabilidades_count ?? vulns.length;
  const permisos = agente.auditoria
    ? getApprovedPermissionRows(agente.auditoria.permisos_aprobados)
    : [];
  const integrityHash =
    agente.auditoria?.hash_integridad ?? agente.hash_integridad;
  const isFree = agente.precio_usd === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${agente.nombre}`}
        className="
          relative z-10 flex h-full w-full max-w-lg flex-col
          border-l border-neutral-800/80 bg-[#0b0d10]
          animate-slide-in-right
        "
      >
        {/* Close button */}
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            Panel de confianza
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="flex h-8 w-8 items-center justify-center rounded-lg
                       text-neutral-500 transition-colors duration-200
                       hover:bg-white/[0.04] hover:text-neutral-300"
          >
            <X size={16} strokeWidth={1.25} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="drawer-scroll flex-1 overflow-y-auto">
          {/* Header */}
          <div className="space-y-5 border-b border-neutral-800/60 px-6 py-6">
            <div className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                {etiquetaTipoActivo(agente.tipo_activo)}
              </p>
              <h2 className="text-2xl font-medium tracking-tight text-neutral-100">
                {agente.nombre}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-neutral-400">
                v{agente.version}
              </span>
              <span className="h-1 w-1 rounded-full bg-neutral-700" aria-hidden="true" />
              <span className="text-lg font-medium tracking-tight text-neutral-100">
                {formatearPrecio(agente.precio_usd)}
              </span>
            </div>

            {/* Audit badge */}
            <div className={`inline-flex items-center gap-2 text-sm ${visual.text}`}>
              <AuditIcon size={14} strokeWidth={1.25} aria-hidden="true" />
              <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
              {visual.label}
            </div>

            <p className="text-sm leading-relaxed text-neutral-400">
              {agente.descripcion}
            </p>
          </div>

          {/* Inspección técnica */}
          <div className="space-y-4 border-b border-neutral-800/60 px-6 py-6">
            <div className="flex items-center gap-2">
              <Lock size={12} strokeWidth={1.25} className="text-neutral-500" aria-hidden="true" />
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Inspección técnica — Logs del Sandbox
              </h3>
            </div>

            {/* Log block */}
            <div className="rounded-lg border border-neutral-800/60 bg-neutral-900/50 p-4">
              <pre className="space-y-0.5 font-mono text-[11px] leading-relaxed">
                {logs.map((line, i) => (
                  <div key={i} className={logTagColor(line.tag)}>
                    {line.text || "\u00A0"}
                  </div>
                ))}
              </pre>
            </div>
          </div>

          {/* Vulnerabilidades (if any) */}
          {(vulns.length > 0 || vulnCount > 0) && (
            <div className="space-y-3 border-b border-neutral-800/60 px-6 py-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Vulnerabilidades detectadas ({vulns.length > 0 ? vulns.length : vulnCount})
              </h3>
              {vulns.length > 0 ? (
                <ul className="space-y-2">
                  {vulns.map((v) => (
                    <li
                      key={v.id}
                      className={`rounded-md border px-3 py-2 text-xs ${severityColor(v.severidad)}`}
                    >
                      <span className="font-mono font-medium uppercase">
                        [{v.severidad}]
                      </span>{" "}
                      {v.descripcion}
                      {v.cwe && (
                        <span className="ml-2 text-neutral-600">
                          ({v.cwe})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-400/70">
                  El motor de auditoría reportó {vulnCount} hallazgo
                  {vulnCount === 1 ? "" : "s"} potencial
                  {vulnCount === 1 ? "" : "es"} en el análisis estático del
                  descriptor.
                </p>
              )}
            </div>
          )}

          {/* Permisos aprobados */}
          {permisos.length > 0 && (
            <div className="space-y-3 border-b border-neutral-800/60 px-6 py-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Permisos aprobados ({permisos.length})
              </h3>
              <ul className="space-y-1.5">
                {permisos.map((p, i) => (
                  <li
                    key={`${p.scope}-${p.resource}-${i}`}
                    className="flex items-baseline gap-2 font-mono text-[11px] text-neutral-400"
                  >
                    <span className="text-emerald-400/60">●</span>
                    <span className="text-neutral-500">{p.scope}</span>
                    <span className="text-neutral-300">{p.resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Integrity hash */}
          {integrityHash && (
            <div className="space-y-2 px-6 py-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Hash de integridad
              </h3>
              <p className="break-all font-mono text-[11px] leading-relaxed text-neutral-500">
                SHA-256: {integrityHash}
              </p>
              {agente.firma_digital && (
                <p className="font-mono text-[11px] text-neutral-600">
                  Firma: {agente.firma_digital}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action button — sticky bottom */}
        <div className="border-t border-neutral-800/60 px-6 py-5">
          <button
            type="button"
            onClick={handleAcquire}
            disabled={isProcessing}
            className="
              flex w-full items-center justify-center gap-2 rounded-lg
              bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-900
              transition-all duration-200 hover:bg-white
              active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            {isProcessing ? (
              <>
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border border-neutral-700 border-t-transparent"
                  aria-hidden="true"
                />
                Procesando...
              </>
            ) : isFree ? (
              <>
                <Download size={15} strokeWidth={1.5} aria-hidden="true" />
                Adquirir activo — Gratis
              </>
            ) : (
              <>
                <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
                Adquirir activo — {formatearPrecio(agente.precio_usd)}
              </>
            )}
          </button>

          {toastMessage && (
            <p
              role="status"
              className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300/90"
            >
              {toastMessage}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
