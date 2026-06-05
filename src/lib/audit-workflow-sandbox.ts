import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { ApprovedPermissions } from "@/lib/audit-types";

const execFileAsync = promisify(execFile);

const METADATA_START = "---METADATA_START---";
const METADATA_END = "---METADATA_END---";
const DOCKER_IMAGE =
  process.env.CERTIA_SANDBOX_IMAGE?.trim() || "certia-sandbox";
const SANDBOX_WORK_DIR = path.join(process.cwd(), "src", "sandbox");
const DOCKER_INPUT_MOUNT = "/usr/src/app/input.json";
const DOCKER_RUN_TIMEOUT_MS = 5_000;
const DOCKER_MAX_BUFFER = 1 * 1024 * 1024;
export const WORKFLOW_TIMEOUT_FAIL_LOG =
  "[FAIL] sandbox_isolation: El tiempo de ejecución del contenedor superó el límite de seguridad (5000ms).";

export interface WorkflowSandboxInput {
  assetName: string;
  assetDescriptor: string;
}

export interface WorkflowSandboxOutcome {
  logs_sandbox: string;
  permisos_aprobados: ApprovedPermissions;
  vulnerabilidades_detectadas: number;
  resultado_global: boolean;
}

interface SandboxInputPayload {
  assetName: string;
  descriptor: Record<string, unknown>;
  auditedAt: string;
}

interface SandboxExecutionError extends Error {
  isTimeoutOrBufferBreach?: boolean;
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

function buildSandboxInputPayload(input: WorkflowSandboxInput): SandboxInputPayload {
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

export function buildDeniedWorkflowPermissions(): ApprovedPermissions {
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

function assessWorkflowVulnerabilities(permissions: ApprovedPermissions): number {
  let vulnerabilities = 0;
  if (permissions.read_filesystem) vulnerabilities += 1;
  if (permissions.network_access) vulnerabilities += 1;
  if (permissions.custom_scripts.enabled) vulnerabilities += 1;
  if (permissions.allowed_domains.length > 5) vulnerabilities += 1;
  return vulnerabilities;
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

export function isWorkflowSandboxInfrastructureError(message: string): boolean {
  return /docker daemon|docker_engine|cannot connect to the docker|fallo al ejecutar el sandbox docker|certia-sandbox no devolvió|unable to find image|pull access denied|ENOENT/i.test(
    message,
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

async function ensureSandboxWorkDir(): Promise<void> {
  await mkdir(SANDBOX_WORK_DIR, { recursive: true });
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
  const hostPath = path.resolve(inputPath);
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
      const timeoutError = new Error(WORKFLOW_TIMEOUT_FAIL_LOG) as SandboxExecutionError;
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

export async function auditReferenceArchitectureWorkflow(
  input: WorkflowSandboxInput,
): Promise<WorkflowSandboxOutcome> {
  const payload = buildSandboxInputPayload(input);
  let tempInputPath: string | null = null;

  try {
    tempInputPath = await writeTemporaryInputFile(payload);
    const dockerStdout = await runDockerSandbox(tempInputPath);
    const { logs_sandbox, permisos_aprobados } =
      extractMetadataFromStdout(dockerStdout);

    const vulnerabilidades_detectadas =
      assessWorkflowVulnerabilities(permisos_aprobados);

    return {
      logs_sandbox,
      permisos_aprobados,
      vulnerabilidades_detectadas,
      resultado_global: vulnerabilidades_detectadas === 0,
    };
  } finally {
    if (tempInputPath) {
      await removeTemporaryInputFile(tempInputPath);
    }
  }
}
