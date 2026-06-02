import { createHash, webcrypto } from "node:crypto";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { query } from "@/lib/db";

const execFileAsync = promisify(execFile);

const METADATA_START = "---METADATA_START---";
const METADATA_END = "---METADATA_END---";
const DOCKER_IMAGE =
  process.env.CERTIA_SANDBOX_IMAGE?.trim() || "certia-sandbox";
const SANDBOX_WORK_DIR = path.join(process.cwd(), "src", "sandbox");
const DOCKER_INPUT_MOUNT = "/usr/src/app/input.json";
const DOCKER_RUN_TIMEOUT_MS = 5_000;
const DOCKER_MAX_BUFFER = 1 * 1024 * 1024;
const TIMEOUT_FAIL_LOG =
  "[FAIL] sandbox_isolation: El tiempo de ejecución del contenedor superó el límite de seguridad (5000ms).";

/**
 * Entrada mínima del motor de certificación.
 */
export interface AuditEngineInput {
  assetId?: string;
  assetName: string;
  assetDescriptor: string;
}

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

/**
 * Salida directa del motor para persistencia en `auditorias` (v2.0).
 */
export interface SimulatedAuditRecord {
  resultado_global: boolean;
  logs_sandbox: string;
  vulnerabilidades_detectadas: number;
  permisos_aprobados: ApprovedPermissions;
  hash_integridad: string;
}

interface SandboxInputPayload {
  assetName: string;
  descriptor: Record<string, unknown>;
  auditedAt: string;
}

interface SandboxExecutionError extends Error {
  isTimeoutOrBufferBreach?: boolean;
}

/**
 * Calcula SHA-256 del descriptor del activo.
 */
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

function parseDescriptor(descriptor: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(descriptor);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* descriptor plano */
  }
  return { raw: descriptor };
}

function buildSandboxInputPayload(input: AuditEngineInput): SandboxInputPayload {
  return {
    assetName: input.assetName,
    descriptor: parseDescriptor(input.assetDescriptor),
    auditedAt: new Date().toISOString(),
  };
}

function assertApprovedPermissions(value: unknown): ApprovedPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      "El JSON de permisos del sandbox no tiene la forma ApprovedPermissions.",
    );
  }

  const record = value as Record<string, unknown>;
  const customScripts = record.custom_scripts;

  if (
    typeof record.read_filesystem !== "boolean" ||
    typeof record.network_access !== "boolean" ||
    !Array.isArray(record.allowed_domains) ||
    !record.allowed_domains.every((d) => typeof d === "string") ||
    typeof customScripts !== "object" ||
    customScripts === null ||
    Array.isArray(customScripts)
  ) {
    throw new Error(
      "El JSON de permisos del sandbox no tiene la forma ApprovedPermissions.",
    );
  }

  const scripts = customScripts as Record<string, unknown>;
  if (
    typeof scripts.enabled !== "boolean" ||
    typeof scripts.inline_code_detected !== "boolean" ||
    !Array.isArray(scripts.execution_engines) ||
    !scripts.execution_engines.every((e) => typeof e === "string")
  ) {
    throw new Error(
      "El bloque custom_scripts del sandbox no es válido.",
    );
  }

  return {
    read_filesystem: record.read_filesystem,
    network_access: record.network_access,
    allowed_domains: record.allowed_domains,
    custom_scripts: {
      enabled: scripts.enabled,
      inline_code_detected: scripts.inline_code_detected,
      execution_engines: scripts.execution_engines,
    },
  };
}

function buildDeniedPermissions(): ApprovedPermissions {
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

function isTimeoutOrBufferError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message ?? "";
  if (
    /timed out|maxbuffer|stdout maxBuffer length exceeded|ERR_CHILD_PROCESS_STDIO_MAXBUFFER|ETIMEDOUT/i.test(
      message,
    )
  ) {
    return true;
  }

  const maybeExecError = error as Error & {
    killed?: boolean;
    signal?: string | null;
    code?: string | number | null;
  };

  return (
    maybeExecError.killed === true &&
    (maybeExecError.signal === "SIGTERM" ||
      maybeExecError.signal === "SIGKILL" ||
      maybeExecError.code === "ETIMEDOUT")
  );
}

function extractMetadataFromStdout(stdout: string): {
  logs_sandbox: string;
  permisos_aprobados: ApprovedPermissions;
} {
  const start = stdout.indexOf(METADATA_START);
  const end = stdout.indexOf(METADATA_END);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Salida del contenedor sin etiquetas ${METADATA_START} / ${METADATA_END}.`,
    );
  }

  const metadataRaw = stdout
    .slice(start + METADATA_START.length, end)
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(metadataRaw) as unknown;
  } catch {
    throw new Error("No se pudo parsear el JSON de permisos del sandbox.");
  }

  return {
    logs_sandbox: stdout.trim(),
    permisos_aprobados: assertApprovedPermissions(parsed),
  };
}

function assessVulnerabilities(permissions: ApprovedPermissions): number {
  let vulnerabilities = 0;
  if (permissions.read_filesystem) vulnerabilities += 1;
  if (permissions.network_access) vulnerabilities += 1;
  if (permissions.custom_scripts.enabled) vulnerabilities += 1;
  if (permissions.allowed_domains.length > 5) vulnerabilities += 1;
  return vulnerabilities;
}

async function ensureSandboxWorkDir(): Promise<void> {
  await mkdir(SANDBOX_WORK_DIR, { recursive: true });
}

function resolveHostPathForDockerMount(absolutePath: string): string {
  return path.resolve(absolutePath);
}

async function writeTemporaryInputFile(
  payload: SandboxInputPayload,
): Promise<string> {
  await ensureSandboxWorkDir();
  const fileName = `audit-input-${randomUUID()}.json`;
  const absolutePath = path.join(SANDBOX_WORK_DIR, fileName);
  await writeFile(absolutePath, JSON.stringify(payload, null, 2), "utf8");
  return absolutePath;
}

async function removeTemporaryInputFile(absolutePath: string): Promise<void> {
  try {
    await unlink(absolutePath);
  } catch {
    /* ya eliminado o inexistente */
  }
}

async function runDockerSandbox(inputPath: string): Promise<string> {
  const hostPath = resolveHostPathForDockerMount(inputPath);
  const volumeSpec = `${hostPath}:${DOCKER_INPUT_MOUNT}:ro`;

  try {
    const { stdout, stderr } = await execFileAsync(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        "none",
        "-m",
        "128m",
        "-v",
        volumeSpec,
        DOCKER_IMAGE,
      ],
      {
        encoding: "utf8",
        maxBuffer: DOCKER_MAX_BUFFER,
        timeout: DOCKER_RUN_TIMEOUT_MS,
        windowsHide: true,
      },
    );

    const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
    if (!combined) {
      throw new Error("El contenedor certia-sandbox no devolvió salida.");
    }
    return combined;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido en Docker.";
    const timeoutOrBufferExceeded = isTimeoutOrBufferError(error);

    if (timeoutOrBufferExceeded) {
      const timeoutError = new Error(TIMEOUT_FAIL_LOG) as SandboxExecutionError;
      timeoutError.isTimeoutOrBufferBreach = true;
      throw timeoutError;
    }

    const missingImage =
      /Unable to find image|pull access denied|repository does not exist/i.test(
        message,
      );
    const hint = missingImage
      ? " Ejecuta primero: npm run sandbox:build"
      : "";
    throw new Error(
      `Fallo al ejecutar el sandbox Docker (${DOCKER_IMAGE}): ${message}.${hint}`,
    );
  }
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

/**
 * Motor principal de certificación: ejecuta el contenedor `certia-sandbox`
 * con el descriptor del activo montado como volumen de solo lectura.
 */
export async function runSimulatedAuditEngine(
  input: AuditEngineInput,
): Promise<SimulatedAuditRecord> {
  const hash_integridad = await computeSha256(input.assetDescriptor);
  const payload = buildSandboxInputPayload(input);

  let tempInputPath: string | null = null;

  try {
    tempInputPath = await writeTemporaryInputFile(payload);
    const dockerStdout = await runDockerSandbox(tempInputPath);
    const { logs_sandbox, permisos_aprobados } =
      extractMetadataFromStdout(dockerStdout);

    const vulnerabilidades_detectadas =
      assessVulnerabilities(permisos_aprobados);
    const resultado_global = vulnerabilidades_detectadas === 0;
    await updateAgenteAuditState(input.assetId, resultado_global);

    return {
      resultado_global,
      logs_sandbox,
      vulnerabilidades_detectadas,
      permisos_aprobados,
      hash_integridad,
    };
  } catch (error) {
    const isTimeoutOrBufferBreach =
      error instanceof Error &&
      (error as SandboxExecutionError).isTimeoutOrBufferBreach === true;
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido en sandbox.";

    const logs_sandbox = isTimeoutOrBufferBreach
      ? TIMEOUT_FAIL_LOG
      : [
          `[FAIL] sandbox_isolation: ${errorMessage}`,
          "[FAIL] sandbox_isolation: El activo fue rechazado por error crítico durante la auditoría.",
        ].join("\n");

    await updateAgenteAuditState(input.assetId, false);

    return {
      resultado_global: false,
      logs_sandbox,
      vulnerabilidades_detectadas: 1,
      permisos_aprobados: buildDeniedPermissions(),
      hash_integridad,
    };
  } finally {
    if (tempInputPath) {
      await removeTemporaryInputFile(tempInputPath);
    }
  }
}
