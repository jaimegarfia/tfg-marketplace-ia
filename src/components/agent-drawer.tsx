"use client";

import { useEffect, useCallback } from "react";
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
  ResultadoAuditoria,
  Vulnerabilidad,
} from "@/types/database";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";

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

function generateSimulatedLogs(agente: AgenteConAuditoria): LogLine[] {
  if (agente.auditoria?.logs_sandbox) {
    // Parse real logs if available
    return agente.auditoria.logs_sandbox.split("\n").map((line) => {
      if (line.includes("[PASS]")) return { tag: "PASS" as const, text: line };
      if (line.includes("[FAIL]")) return { tag: "FAIL" as const, text: line };
      if (line.includes("[WARN]")) return { tag: "WARN" as const, text: line };
      return { tag: "INFO" as const, text: line };
    });
  }

  // Generate simulated logs based on estado_auditoria
  const isCertified = agente.estado_auditoria === "certificado";
  const isRejected = agente.estado_auditoria === "rechazado";
  const isAuditing = agente.estado_auditoria === "en_auditoria";

  const lines: LogLine[] = [
    { tag: "INFO", text: `> Sandbox execution initiated for ${agente.nombre}` },
    { tag: "INFO", text: `  Runtime: ${agente.tipo_activo === "runtime_artifact" ? "Docker container v24.0" : "Workflow engine (n8n v1.62)"}` },
    { tag: "INFO", text: `  Version: ${agente.version}` },
    { tag: "INFO", text: "" },
  ];

  if (isCertified) {
    lines.push(
      { tag: "PASS", text: "[PASS] vulnerability_scan: 0 CVEs detected" },
      { tag: "PASS", text: "[PASS] static_analysis: no unsafe patterns" },
      { tag: "PASS", text: `[PASS] integrity_check: SHA-256 ${agente.hash_integridad ? agente.hash_integridad.slice(0, 16) + "..." : "verified"}` },
      { tag: "PASS", text: "[PASS] sandbox_isolation: network policies OK" },
      { tag: "PASS", text: "[PASS] permission_scope: minimal privilege verified" },
      { tag: "INFO", text: "" },
      { tag: "PASS", text: `Digital signature: ${agente.firma_digital ?? "ed25519_verified"}` },
    );
  } else if (isRejected) {
    lines.push(
      { tag: "PASS", text: "[PASS] static_analysis: no unsafe patterns" },
      { tag: "FAIL", text: "[FAIL] vulnerability_scan: 3 CVEs found (2 HIGH)" },
      { tag: "FAIL", text: "  → CVE-2024-3094: arbitrary code execution (xz-utils)" },
      { tag: "FAIL", text: "  → CVE-2024-1086: privilege escalation (nf_tables)" },
      { tag: "WARN", text: "[WARN] sandbox_isolation: outbound network detected" },
      { tag: "FAIL", text: "[FAIL] permission_scope: excessive filesystem access" },
      { tag: "INFO", text: "" },
      { tag: "FAIL", text: "Audit result: REJECTED — critical vulnerabilities" },
    );
  } else if (isAuditing) {
    lines.push(
      { tag: "PASS", text: "[PASS] static_analysis: no unsafe patterns" },
      { tag: "PASS", text: "[PASS] vulnerability_scan: 0 CVEs detected" },
      { tag: "WARN", text: "[WARN] sandbox_isolation: pending network review" },
      { tag: "INFO", text: "[....] permission_scope: analysis in progress..." },
      { tag: "INFO", text: "" },
      { tag: "INFO", text: "Audit in progress — awaiting manual review" },
    );
  } else {
    lines.push(
      { tag: "INFO", text: "No audit has been initiated for this agent." },
      { tag: "INFO", text: "Submit for review to begin certification process." },
    );
  }

  return lines;
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

  if (!agente) return null;

  const visual = AUDIT_VISUALS[agente.estado_auditoria];
  const AuditIcon = visual.icon;
  const logs = generateSimulatedLogs(agente);
  const vulns = agente.auditoria?.vulnerabilidades_detectadas ?? [];
  const permisos = agente.auditoria?.permisos_aprobados ?? [];
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
          {vulns.length > 0 && (
            <div className="space-y-3 border-b border-neutral-800/60 px-6 py-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Vulnerabilidades detectadas ({vulns.length})
              </h3>
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
                    key={i}
                    className="flex items-baseline gap-2 font-mono text-[11px] text-neutral-400"
                  >
                    <span className="text-emerald-400/60">●</span>
                    <span className="text-neutral-500">{p.alcance}</span>
                    <span className="text-neutral-300">{p.recurso}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Integrity hash */}
          {agente.hash_integridad && (
            <div className="space-y-2 px-6 py-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Hash de integridad
              </h3>
              <p className="break-all font-mono text-[11px] leading-relaxed text-neutral-500">
                SHA-256: {agente.hash_integridad}
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
            className="
              flex w-full items-center justify-center gap-2 rounded-lg
              bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-900
              transition-all duration-200 hover:bg-white
              active:scale-[0.98]
            "
          >
            {isFree ? (
              <>
                <Download size={15} strokeWidth={1.5} aria-hidden="true" />
                Descargar Manifesto
              </>
            ) : (
              <>
                <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
                Adquirir activo — {formatearPrecio(agente.precio_usd)}
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
