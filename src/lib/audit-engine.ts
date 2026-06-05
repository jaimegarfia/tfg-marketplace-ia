import { createHash, webcrypto } from "node:crypto";
import { query } from "@/lib/db";
import {
  auditContainerImage,
  extractImageRegistryUri,
  formatTrivyInfrastructureLogs,
  isTrivyInfrastructureError,
} from "@/lib/audit-trivy";
import type { AuditEngineInput, AuditRecord } from "@/lib/audit-types";
import {
  auditReferenceArchitectureWorkflow,
  buildDeniedWorkflowPermissions,
  isWorkflowSandboxInfrastructureError,
  WORKFLOW_TIMEOUT_FAIL_LOG,
} from "@/lib/audit-workflow-sandbox";

export type {
  ApprovedPermissions,
  AuditEngineInput,
  AuditFailureKind,
  AuditRecord,
  SimulatedAuditRecord,
} from "@/lib/audit-types";

async function computeSha256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const contentBuffer = encoder.encode(content);

  if (typeof webcrypto?.subtle !== "undefined") {
    const digest = await webcrypto.subtle.digest("SHA-256", contentBuffer);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return createHash("sha256").update(content).digest("hex");
}

async function updateAgenteAuditState(
  assetId: string | undefined,
  resultado_global: boolean,
): Promise<void> {
  if (!assetId) return;

  const estado = resultado_global ? "certificado" : "rechazado";
  try {
    await query(
      `
        UPDATE agentes
        SET estado_auditoria = $1
        WHERE id::text = $2
      `,
      [estado, assetId],
    );
  } catch (error) {
    console.error(
      `[audit-engine] No se pudo persistir estado '${estado}' para el activo ${assetId}.`,
      error,
    );
  }
}

async function runReferenceArchitectureAudit(
  input: AuditEngineInput,
  hash_integridad: string,
): Promise<AuditRecord> {
  try {
    const outcome = await auditReferenceArchitectureWorkflow({
      assetName: input.assetName,
      assetDescriptor: input.assetDescriptor,
    });

    await updateAgenteAuditState(input.assetId, outcome.resultado_global);

    return {
      resultado_global: outcome.resultado_global,
      logs_sandbox: outcome.logs_sandbox,
      vulnerabilidades_detectadas: outcome.vulnerabilidades_detectadas,
      permisos_aprobados: outcome.permisos_aprobados,
      hash_integridad,
      failureKind: outcome.resultado_global ? "none" : "security",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido en sandbox.";
    const isTimeout =
      error instanceof Error && error.message === WORKFLOW_TIMEOUT_FAIL_LOG;
    const infrastructure =
      isTimeout || isWorkflowSandboxInfrastructureError(errorMessage);

    const logs_sandbox = isTimeout
      ? WORKFLOW_TIMEOUT_FAIL_LOG
      : [
          `[FAIL] sandbox_isolation: ${errorMessage}`,
          infrastructure
            ? "[FAIL] sandbox_isolation: La auditoría no se completó por un fallo del entorno (Docker/sandbox), no por el descriptor del activo."
            : "[FAIL] sandbox_isolation: El activo fue rechazado por superficie de riesgo detectada en el descriptor.",
        ].join("\n");

    await updateAgenteAuditState(input.assetId, false);

    return {
      resultado_global: false,
      logs_sandbox,
      vulnerabilidades_detectadas: infrastructure ? 0 : 1,
      permisos_aprobados: infrastructure
        ? null
        : buildDeniedWorkflowPermissions(),
      hash_integridad,
      failureKind: infrastructure ? "infrastructure" : "security",
    };
  }
}

async function runRuntimeArtifactAudit(
  input: AuditEngineInput,
  hash_integridad: string,
): Promise<AuditRecord> {
  let imageRef: string | null = null;

  try {
    imageRef = extractImageRegistryUri(input.assetDescriptor);
  } catch (descriptorError) {
    const message =
      descriptorError instanceof Error
        ? descriptorError.message
        : "Descriptor de contenedor inválido.";
    const logs = formatTrivyInfrastructureLogs(
      input.assetName,
      null,
      message,
      descriptorError instanceof Error ? descriptorError.stack : undefined,
    );
    await updateAgenteAuditState(input.assetId, false);
    return {
      resultado_global: false,
      logs_sandbox: logs,
      vulnerabilidades_detectadas: 0,
      permisos_aprobados: null,
      hash_integridad,
      failureKind: "infrastructure",
    };
  }

  try {
    const trivy = await auditContainerImage(
      input.assetName,
      input.assetDescriptor,
    );
    const resultado_global = trivy.criticalHighCount === 0;

    await updateAgenteAuditState(input.assetId, resultado_global);

    return {
      resultado_global,
      logs_sandbox: trivy.logs_sandbox,
      vulnerabilidades_detectadas: trivy.criticalHighCount,
      permisos_aprobados: trivy.permisos_aprobados,
      hash_integridad,
      failureKind: resultado_global ? "none" : "security",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido en Trivy.";
    const stack = error instanceof Error ? error.stack : undefined;
    const infrastructure = isTrivyInfrastructureError(errorMessage);

    const logs_sandbox = formatTrivyInfrastructureLogs(
      input.assetName,
      imageRef,
      errorMessage,
      stack,
    );

    await updateAgenteAuditState(input.assetId, false);

    return {
      resultado_global: false,
      logs_sandbox,
      vulnerabilidades_detectadas: 0,
      permisos_aprobados: null,
      hash_integridad,
      failureKind: infrastructure ? "infrastructure" : "security",
    };
  }
}

/**
 * Motor híbrido de certificación: workflows vía certia-sandbox (estático),
 * contenedores vía Trivy (escaneo real de capas de imagen).
 */
export async function runAuditEngine(
  input: AuditEngineInput,
): Promise<AuditRecord> {
  const hash_integridad = await computeSha256(input.assetDescriptor);

  if (input.tipoActivo === "reference_architecture") {
    return runReferenceArchitectureAudit(input, hash_integridad);
  }

  if (input.tipoActivo === "runtime_artifact") {
    return runRuntimeArtifactAudit(input, hash_integridad);
  }

  const logs = `[FAIL] audit_engine: tipo_activo no soportado (${String(input.tipoActivo)}).`;
  await updateAgenteAuditState(input.assetId, false);
  return {
    resultado_global: false,
    logs_sandbox: logs,
    vulnerabilidades_detectadas: 0,
    permisos_aprobados: null,
    hash_integridad,
    failureKind: "infrastructure",
  };
}

/** @deprecated Usar `runAuditEngine`. */
export async function runSimulatedAuditEngine(
  input: AuditEngineInput,
): Promise<AuditRecord> {
  return runAuditEngine(input);
}
