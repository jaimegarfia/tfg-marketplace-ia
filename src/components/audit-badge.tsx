import {
  BadgeCheck,
  FlaskConical,
  PencilLine,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { EstadoAuditoria } from "@/types/database";

interface BadgeVisual {
  label: string;
  icon: LucideIcon;
  className: string;
}

/**
 * Mapeo declarativo estado → presentación. Mantiene la lógica de color/icono
 * fuera del JSX (principio de responsabilidad única) y facilita añadir estados.
 */
const VISUALS: Record<EstadoAuditoria, BadgeVisual> = {
  certificado: {
    label: "Certificado",
    icon: BadgeCheck,
    className:
      "bg-mint-50 text-mint-700 ring-1 ring-inset ring-mint-200 dark:bg-mint-500/10 dark:text-mint-400 dark:ring-mint-400/20",
  },
  en_auditoria: {
    label: "En auditoría",
    icon: FlaskConical,
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  },
  borrador: {
    label: "Borrador",
    icon: PencilLine,
    className:
      "bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200 dark:bg-stone-500/10 dark:text-stone-300 dark:ring-stone-500/20",
  },
  rechazado: {
    label: "Rechazado",
    icon: ShieldAlert,
    className:
      "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/20",
  },
};

interface AuditBadgeProps {
  estado: EstadoAuditoria;
}

export function AuditBadge({ estado }: AuditBadgeProps) {
  const visual = VISUALS[estado];
  const Icon = visual.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${visual.className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {visual.label}
    </span>
  );
}
