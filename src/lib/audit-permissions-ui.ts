import type { ApprovedPermissions } from "@/lib/audit-engine";

export interface PermissionRow {
  scope: string;
  resource: string;
}

/** Filas legibles para el panel de permisos aprobados (JSONB v2). */
export function getApprovedPermissionRows(
  permisos: ApprovedPermissions,
): PermissionRow[] {
  const rows: PermissionRow[] = [];

  if (permisos.read_filesystem) {
    rows.push({
      scope: "lectura/escritura",
      resource: "filesystem local",
    });
  }

  if (permisos.network_access) {
    if (permisos.allowed_domains.length === 0) {
      rows.push({
        scope: "red",
        resource: "outbound (sin dominios explícitos en descriptor)",
      });
    } else {
      for (const domain of permisos.allowed_domains) {
        rows.push({ scope: "red", resource: domain });
      }
    }
  }

  if (permisos.custom_scripts.enabled) {
    const engines = permisos.custom_scripts.execution_engines.join(", ");
    rows.push({
      scope: "ejecución",
      resource: `scripts (${engines})`,
    });
    if (permisos.custom_scripts.inline_code_detected) {
      rows.push({
        scope: "ejecución",
        resource: "código inline detectado en descriptor",
      });
    }
  }

  return rows;
}
