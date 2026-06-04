"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  FlaskConical,
  PencilLine,
  ArrowUpRight,
  Download,
  Lock,
  Server,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type {
  AgenteConAuditoria,
  EstadoAuditoria,
  Vulnerabilidad,
} from "@/types/database";
import { etiquetaTipoActivo, formatearPrecio } from "@/lib/catalog-format";
import { VerifiedPermissionsScope } from "@/components/verified-permissions-scope";
import { useAuth } from "@/context/auth-context";
import type { ApprovedPermissions } from "@/lib/audit-engine";
import { isApprovedPermissions } from "@/lib/audit-catalog";
import { CodeBlock } from "@/components/drawer/code-block";
import { buildDeploymentGuide } from "@/lib/deployment-guide";

/* ── Tabs ───────────────────────────────────────────────────────────── */

type DrawerTab = "inspeccion" | "despliegue" | "adaptacion";

const DRAWER_TABS: ReadonlyArray<{ id: DrawerTab; label: string }> = [
  { id: "inspeccion", label: "Inspección Técnica" },
  { id: "despliegue", label: "Guía de Despliegue" },
  { id: "adaptacion", label: "Servicios de Adaptación" },
];

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

function fallbackPermissions(): ApprovedPermissions {
  return {
    read_filesystem: false,
    network_access: false,
    allowed_domains: [],
    custom_scripts: {
      enabled: false,
      inline_code_detected: false,
      execution_engines: ["none"],
    },
  };
}

/* ── Tab panels ─────────────────────────────────────────────────────── */

interface DrawerTabBarProps {
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
}

function DrawerTabBar({ activeTab, onTabChange }: DrawerTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del detalle del activo"
      className="flex border-b border-neutral-800/60"
    >
      {DRAWER_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`drawer-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`drawer-panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex-1 px-3 py-3 text-center text-[11px] font-medium
              transition-colors sm:px-4 sm:text-xs
              ${
                isActive
                  ? "text-neutral-100 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-emerald-400/80"
                  : "text-neutral-500 hover:text-neutral-300"
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface TechnicalInspectionTabProps {
  agente: AgenteConAuditoria;
  logs: LogLine[];
  permisos: ApprovedPermissions;
  vulns: Vulnerabilidad[];
  vulnCount: number;
  integrityHash: string | null;
}

function TechnicalInspectionTab({
  agente,
  logs,
  permisos,
  vulns,
  vulnCount,
  integrityHash,
}: TechnicalInspectionTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock
            size={12}
            strokeWidth={1.25}
            className="text-neutral-500"
            aria-hidden="true"
          />
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Logs del Sandbox
          </h3>
        </div>

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

      {agente.auditoria && (
        <VerifiedPermissionsScope permisos={permisos} embedded />
      )}

      {(vulns.length > 0 || vulnCount > 0) && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Vulnerabilidades detectadas (
            {vulns.length > 0 ? vulns.length : vulnCount})
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
                    <span className="ml-2 text-neutral-600">({v.cwe})</span>
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

      {integrityHash && (
        <div className="space-y-2">
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
  );
}

interface DeploymentGuideTabProps {
  agente: AgenteConAuditoria;
  permisos: ApprovedPermissions;
}

function DeploymentGuideTab({ agente, permisos }: DeploymentGuideTabProps) {
  const guide = buildDeploymentGuide(agente, permisos);
  const developerGuia = agente.guia_despliegue?.trim();
  const HeaderIcon = guide.variant === "runtime_artifact" ? Server : Workflow;
  const iconClass =
    guide.variant === "runtime_artifact"
      ? "text-emerald-400/80"
      : "text-sky-400/80";

  return (
    <div className="space-y-5">
      {developerGuia && (
        <section className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80">
            Instrucciones del desarrollador
          </p>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
            {developerGuia}
          </div>
        </section>
      )}

      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
        Referencia técnica Certia
      </p>

      <div className="flex items-start gap-3">
        <HeaderIcon
          size={16}
          strokeWidth={1.25}
          className={`mt-0.5 shrink-0 ${iconClass}`}
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            {guide.variant === "runtime_artifact"
              ? "Artefacto ejecutable"
              : "Arquitectura de referencia"}{" "}
            · {agente.categoria}
          </p>
          <h3 className="text-sm font-medium text-neutral-200">{guide.title}</h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            {guide.description}
          </p>
        </div>
      </div>

      {guide.steps.length > 0 && (
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-neutral-400">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}

      <CodeBlock
        code={guide.primaryBlock.code}
        label={guide.primaryBlock.label}
      />

      {guide.secondaryBlock && (
        <CodeBlock
          code={guide.secondaryBlock.code}
          label={guide.secondaryBlock.label}
        />
      )}

      <ul className="space-y-2 text-xs leading-relaxed text-neutral-500">
        {guide.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

interface AdaptationServicesTabProps {
  admiteAdaptacion: boolean;
  isSubmitting: boolean;
  contextoPrivadoDesc: string;
  onContextoChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  formError: string | null;
}

function AdaptationServicesTab({
  admiteAdaptacion,
  isSubmitting,
  contextoPrivadoDesc,
  onContextoChange,
  onSubmit,
  formError,
}: AdaptationServicesTabProps) {
  if (!admiteAdaptacion) {
    return (
      <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/40 p-4">
        <p className="text-sm font-medium text-neutral-300">
          Adaptación no disponible
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          El desarrollador no ofrece servicios de adaptación o fine-tuning para
          este activo. Puedes desplegarlo según la guía estándar o contactar al
          vendedor por otros canales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300/90">
        Adaptación disponible
      </p>
      <p className="text-sm leading-relaxed text-neutral-400">
        Si tu organización requiere conectar este agente con fuentes de datos
        privadas o necesita una arquitectura a medida, puedes solicitar un
        Servicio de Adaptación directa al desarrollador de este activo.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="contexto_privado_desc"
            className="font-mono text-xs uppercase tracking-widest text-neutral-500"
          >
            Requisitos de personalización
          </label>
          <textarea
            id="contexto_privado_desc"
            name="contexto_privado_desc"
            rows={7}
            required
            minLength={20}
            disabled={isSubmitting}
            value={contextoPrivadoDesc}
            onChange={(event) => onContextoChange(event.target.value)}
            placeholder="Describe fuentes de datos corporativas, restricciones de compliance, integraciones necesarias y el entorno de despliegue objetivo..."
            className="
              w-full resize-y rounded-lg border border-neutral-800/80 bg-neutral-950/60
              px-3 py-3 text-sm leading-relaxed text-neutral-200
              placeholder:text-neutral-600
              focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600
              disabled:cursor-not-allowed disabled:opacity-50
            "
          />
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300/90"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || contextoPrivadoDesc.trim().length < 20}
          className="
            flex w-full items-center justify-center gap-2 rounded-lg
            border border-emerald-500/30 bg-emerald-500/10 px-5 py-3
            text-sm font-medium text-emerald-200
            transition hover:bg-emerald-500/15
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isSubmitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400/40 border-t-emerald-200"
                aria-hidden="true"
              />
              Registrando solicitud...
            </>
          ) : (
            "Solicitar Adaptación a Medida"
          )}
        </button>
      </form>
    </div>
  );
}

/* ── Main drawer ────────────────────────────────────────────────────── */

interface AgentDrawerProps {
  agente: AgenteConAuditoria | null;
  onClose: () => void;
}

export function AgentDrawer({ agente, onClose }: AgentDrawerProps) {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<DrawerTab>("inspeccion");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contextoPrivadoDesc, setContextoPrivadoDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
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
    if (agente) {
      setActiveTab("inspeccion");
      setContextoPrivadoDesc("");
      setFormError(null);
    }
  }, [agente?.id]);

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
    }, 3200);
  }, []);

  const handleAcquire = useCallback(async () => {
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

  const handleAdaptationSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!agente) return;

      if (!user) {
        openAuthModal();
        return;
      }

      setFormError(null);

      try {
        setIsSubmitting(true);

        const response = await fetch("/api/fine-tuning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            agenteId: agente.id,
            contextoPrivadoDesc,
          }),
        });

        const data: { ok?: boolean; error?: string; message?: string } =
          await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ?? "No se pudo registrar la solicitud de adaptación.",
          );
        }

        setContextoPrivadoDesc("");
        showToast(
          data.message ??
            "Solicitud de fine-tuning registrada correctamente. El desarrollador revisará tu propuesta en su panel de control.",
        );
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Error inesperado al enviar la solicitud.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [agente, contextoPrivadoDesc, openAuthModal, showToast, user],
  );

  if (!agente) return null;

  const visual = AUDIT_VISUALS[agente.estado_auditoria];
  const AuditIcon = visual.icon;
  const logs = parseSandboxLogs(agente.auditoria?.logs_sandbox);
  const vulns = agente.auditoria?.vulnerabilidades_detectadas ?? [];
  const vulnCount =
    agente.auditoria?.vulnerabilidades_count ?? vulns.length;
  const permisosRaw = agente.auditoria?.permisos_aprobados;
  const permisosEstructurados: ApprovedPermissions = isApprovedPermissions(
    permisosRaw,
  )
    ? permisosRaw
    : fallbackPermissions();
  const integrityHash =
    agente.auditoria?.hash_integridad ?? agente.hash_integridad;
  const isFree = agente.precio_eur === 0;

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
        aria-label={`Detalle de ${agente.nombre}`}
        className="
          relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col
          rounded-t-2xl border border-neutral-800/80 bg-[#0b0d10]
          shadow-2xl shadow-black/50
          animate-fade-up
          sm:max-h-[85vh] sm:rounded-2xl
        "
      >
        <div className="flex items-center justify-between border-b border-neutral-800/60 px-5 py-4 sm:px-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Detalle del activo
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg
                       text-neutral-500 transition-colors duration-200
                       hover:bg-white/[0.04] hover:text-neutral-300"
          >
            <X size={16} strokeWidth={1.25} />
          </button>
        </div>

        <div className="drawer-scroll flex-1 overflow-y-auto">
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
              <span
                className="h-1 w-1 rounded-full bg-neutral-700"
                aria-hidden="true"
              />
              <span className="text-lg font-medium tracking-tight text-neutral-100">
                {formatearPrecio(agente.precio_eur)}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-2 text-sm ${visual.text}`}
            >
              <AuditIcon size={14} strokeWidth={1.25} aria-hidden="true" />
              <span className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
              {visual.label}
            </div>

            <p className="text-sm leading-relaxed text-neutral-400">
              {agente.descripcion}
            </p>

            {agente.admite_adaptacion ? (
              <span className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300/90">
                Adaptación disponible
              </span>
            ) : (
              <span className="inline-flex rounded-md border border-neutral-700/80 bg-neutral-900/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Sin servicio de adaptación
              </span>
            )}
          </div>

          <DrawerTabBar activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="px-6 py-6">
            {activeTab === "inspeccion" && (
              <div
                role="tabpanel"
                id="drawer-panel-inspeccion"
                aria-labelledby="drawer-tab-inspeccion"
              >
                <TechnicalInspectionTab
                  agente={agente}
                  logs={logs}
                  permisos={permisosEstructurados}
                  vulns={vulns}
                  vulnCount={vulnCount}
                  integrityHash={integrityHash}
                />
              </div>
            )}

            {activeTab === "despliegue" && (
              <div
                role="tabpanel"
                id="drawer-panel-despliegue"
                aria-labelledby="drawer-tab-despliegue"
              >
                <DeploymentGuideTab
                  agente={agente}
                  permisos={permisosEstructurados}
                />
              </div>
            )}

            {activeTab === "adaptacion" && (
              <div
                role="tabpanel"
                id="drawer-panel-adaptacion"
                aria-labelledby="drawer-tab-adaptacion"
              >
                <AdaptationServicesTab
                  admiteAdaptacion={agente.admite_adaptacion}
                  isSubmitting={isSubmitting}
                  contextoPrivadoDesc={contextoPrivadoDesc}
                  onContextoChange={setContextoPrivadoDesc}
                  onSubmit={handleAdaptationSubmit}
                  formError={formError}
                />
              </div>
            )}
          </div>
        </div>

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
                  className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-900"
                  aria-hidden="true"
                />
                Procesando transacción...
              </>
            ) : isFree ? (
              <>
                <Download size={15} strokeWidth={1.5} aria-hidden="true" />
                Adquirir activo — Gratis
              </>
            ) : (
              <>
                <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
                Adquirir activo — {formatearPrecio(agente.precio_eur)}
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
      </div>
    </div>
  );
}
