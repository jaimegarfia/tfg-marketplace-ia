import type { TipoActivo } from "@/types/database";

/**
 * Estructura JSONB para la columna `permisos_aprobados`.
 */
export interface ApprovedPermissions {
  read_filesystem: boolean;
  network_access: boolean;
  allowed_domains: string[];
  custom_scripts: {
    enabled: boolean;
    inline_code_detected: boolean;
    execution_engines: string[];
  };
}

export type AuditFailureKind = "none" | "infrastructure" | "security";

export interface AuditEngineInput {
  assetId?: string;
  assetName: string;
  assetDescriptor: string;
  tipoActivo: TipoActivo;
}

export interface AuditRecord {
  resultado_global: boolean;
  logs_sandbox: string;
  vulnerabilidades_detectadas: number;
  permisos_aprobados: ApprovedPermissions | null;
  hash_integridad: string;
  failureKind: AuditFailureKind;
}

/** @deprecated Usar `AuditRecord`. */
export type SimulatedAuditRecord = AuditRecord;
