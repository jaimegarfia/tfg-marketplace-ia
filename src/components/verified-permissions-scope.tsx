import type { ReactNode } from "react";
import type { ApprovedPermissions } from "@/lib/audit-engine";
import { Code2, FolderOpen, Globe, ShieldCheck, Zap } from "lucide-react";

interface VerifiedPermissionsScopeProps {
  permisos: ApprovedPermissions;
}

interface PermissionBadgeProps {
  tone: "emerald" | "sky" | "neutral" | "amber";
  icon: ReactNode;
  label: string;
  detail?: string;
}

function PermissionBadge({ tone, icon, label, detail }: PermissionBadgeProps) {
  const tones = {
    emerald:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-300/90",
    sky: "border-sky-500/25 bg-sky-500/10 text-sky-300/90",
    neutral: "border-neutral-700/80 bg-neutral-900/60 text-neutral-400",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300/90",
  };

  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-xs ${tones[tone]}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 opacity-80" aria-hidden="true">
          {icon}
        </span>
        <span className="leading-snug">{label}</span>
      </div>
      {detail && (
        <p className="pl-6 text-[10px] leading-relaxed opacity-75">{detail}</p>
      )}
    </div>
  );
}

export function VerifiedPermissionsScope({
  permisos,
}: VerifiedPermissionsScopeProps) {
  const networkGranted = permisos.network_access;
  const fsGranted = permisos.read_filesystem;
  const dynamicCode = permisos.custom_scripts.enabled;
  const engines = permisos.custom_scripts.execution_engines.filter(
    (e) => e !== "none",
  );

  const allowedDomains =
    permisos.allowed_domains.length > 0
      ? permisos.allowed_domains.join(", ")
      : undefined;

  const isFullyLocked =
    !networkGranted && !fsGranted && !dynamicCode;

  return (
    <div className="space-y-3 border-b border-neutral-800/60 px-6 py-6">
      <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">
        Ámbito de Permisos Verificados
      </h3>
      <div className="flex flex-col gap-2">
        {isFullyLocked && (
          <PermissionBadge
            tone="emerald"
            icon={<ShieldCheck size={14} strokeWidth={1.5} />}
            label="Perfil de mínimo privilegio"
            detail="Sin acceso a red, filesystem ni ejecución dinámica"
          />
        )}

        {networkGranted ? (
          <PermissionBadge
            tone="sky"
            icon={<Globe size={14} strokeWidth={1.5} />}
            label="Acceso a red concedido"
            detail={
              allowedDomains
                ? `Dominios permitidos: ${allowedDomains}`
                : "Sin dominios explícitos en el descriptor"
            }
          />
        ) : (
          <PermissionBadge
            tone="neutral"
            icon={<Globe size={14} strokeWidth={1.5} />}
            label="Red confinada (sin egreso)"
          />
        )}

        {fsGranted ? (
          <PermissionBadge
            tone="amber"
            icon={<FolderOpen size={14} strokeWidth={1.5} />}
            label="Acceso local a sistema de archivos"
            detail="El sandbox autorizó lectura/escritura en filesystem"
          />
        ) : (
          <PermissionBadge
            tone="neutral"
            icon={<FolderOpen size={14} strokeWidth={1.5} />}
            label="Sistema de archivos bloqueado (aislado)"
          />
        )}

        {dynamicCode && (
          <PermissionBadge
            tone="amber"
            icon={<Zap size={14} strokeWidth={1.5} />}
            label="Código dinámico detectado"
            detail={
              permisos.custom_scripts.inline_code_detected
                ? "Se detectó código inline en el descriptor técnico"
                : engines.length > 0
                  ? `Motores: ${engines.join(", ")}`
                  : undefined
            }
          />
        )}

        {dynamicCode && engines.length > 0 && (
          <PermissionBadge
            tone="amber"
            icon={<Code2 size={14} strokeWidth={1.5} />}
            label="Motores de ejecución aprobados"
            detail={engines.join(", ")}
          />
        )}
      </div>
    </div>
  );
}
