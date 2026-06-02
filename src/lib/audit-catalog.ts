import type { ApprovedPermissions } from "@/lib/audit-engine";
import type {
  Agente,
  AgenteConAuditoria,
  ResultadoAuditoria,
  Vulnerabilidad,
} from "@/types/database";

export interface AgenteRowAuditFields {
  audit_resultado: ResultadoAuditoria | boolean | null;
  audit_logs: string | null;
  audit_vulnerabilidades: Vulnerabilidad[] | number | string | null;
  audit_permisos: ApprovedPermissions | string | null;
  audit_fecha: string | null;
}

function parseJsonb<T>(val: T | string | null): T | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }
  return val;
}

export function isApprovedPermissions(
  value: unknown,
): value is ApprovedPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.read_filesystem === "boolean" &&
    typeof record.network_access === "boolean" &&
    Array.isArray(record.allowed_domains) &&
    typeof record.custom_scripts === "object" &&
    record.custom_scripts !== null
  );
}

export function buildAssetDescriptor(agente: Agente): string {
  let technicalBlueprint: unknown = agente.descripcion;
  try {
    technicalBlueprint = JSON.parse(agente.descripcion);
  } catch {
    // Si no es JSON válido, mantenemos el texto para el filtro técnico del sandbox.
  }

  return JSON.stringify({
    metadata: {
      asset: agente.nombre,
      description: agente.descripcion,
    },
    technical_descriptor: {
      version: agente.version,
      type: agente.tipo_activo,
      blueprint: technicalBlueprint,
    },
  });
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

function parseResultado(
  resultado: ResultadoAuditoria | boolean | null,
): ResultadoAuditoria {
  if (resultado === true) return "aprobado";
  if (resultado === false) return "rechazado";
  return resultado ?? "advertencia";
}

export function resolveCatalogAuditoriaFromDatabase(
  agente: Agente,
  row: AgenteRowAuditFields,
): {
  auditoria: AgenteConAuditoria["auditoria"];
  hash_integridad: string | null;
} {
  if (!row.audit_resultado || !row.audit_logs) {
    return { auditoria: null, hash_integridad: agente.hash_integridad };
  }

  const parsedVulnsRaw = parseJsonb<unknown>(row.audit_vulnerabilidades);
  const vulns = Array.isArray(parsedVulnsRaw)
    ? (parsedVulnsRaw as Vulnerabilidad[])
    : [];
  const vulnsCount =
    typeof parsedVulnsRaw === "number" ? parsedVulnsRaw : vulns.length;
  const permisosRaw = parseJsonb<unknown>(row.audit_permisos);
  const permisos = isApprovedPermissions(permisosRaw)
    ? permisosRaw
    : fallbackPermissions();

  return {
    auditoria: {
      resultado_global: parseResultado(row.audit_resultado),
      logs_sandbox: row.audit_logs,
      vulnerabilidades_detectadas: vulns,
      vulnerabilidades_count: vulnsCount,
      permisos_aprobados: permisos,
      hash_integridad: agente.hash_integridad ?? "",
      fecha_ejecucion: row.audit_fecha ?? new Date().toISOString(),
    },
    hash_integridad: agente.hash_integridad,
  };
}
