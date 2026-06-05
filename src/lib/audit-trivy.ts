import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ApprovedPermissions } from "@/lib/audit-types";

const execFileAsync = promisify(execFile);

export const TRIVY_IMAGE =
  process.env.CERTIA_TRIVY_IMAGE?.trim() || "aquasec/trivy:latest";
const TRIVY_SCAN_TIMEOUT_MS = 4 * 60 * 1000 + 30_000;
const TRIVY_MAX_BUFFER = 16 * 1024 * 1024;

export interface TrivyVulnerabilityFinding {
  vulnerabilityId: string;
  severity: string;
  title: string;
  pkgName: string;
  installedVersion: string;
  target: string;
}

export interface TrivyScanOutcome {
  criticalHighCount: number;
  findings: TrivyVulnerabilityFinding[];
  logs_sandbox: string;
  permisos_aprobados: ApprovedPermissions;
}

interface TrivyVulnerabilityJson {
  VulnerabilityID?: string;
  Severity?: string;
  Title?: string;
  Description?: string;
  PkgName?: string;
  InstalledVersion?: string;
}

interface TrivyResultJson {
  Target?: string;
  Vulnerabilities?: TrivyVulnerabilityJson[] | null;
}

interface TrivyReportJson {
  Results?: TrivyResultJson[] | null;
}

function resolveDockerSocketMount(): string {
  if (process.platform === "win32") {
    return "//var/run/docker.sock:/var/run/docker.sock";
  }
  return "/var/run/docker.sock:/var/run/docker.sock";
}

export function extractImageRegistryUri(descriptor: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(descriptor);
  } catch {
    throw new Error(
      "El descriptor de contenedor no es JSON válido (se requiere image_registry_uri).",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      "El descriptor de contenedor debe ser un objeto con image_registry_uri.",
    );
  }

  const uri = (parsed as Record<string, unknown>).image_registry_uri;
  if (typeof uri !== "string" || !uri.trim()) {
    throw new Error(
      "El descriptor de contenedor no incluye image_registry_uri válida.",
    );
  }

  return uri.trim();
}

export function isTrivyInfrastructureError(message: string): boolean {
  return /docker daemon|docker_engine|cannot connect to the docker|connection refused|failed to pull|pull access denied|repository does not exist|manifest unknown|name unknown|no such image|not found|unauthorized|authentication required|timeout|timed out|deadline exceeded|ENOENT|ECONNREFUSED|error during connect/i.test(
    message,
  );
}

function normalizeSeverity(value: string | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

function isCriticalOrHigh(severity: string): boolean {
  return severity === "CRITICAL" || severity === "HIGH";
}

export function parseTrivyReportJson(stdout: string): TrivyVulnerabilityFinding[] {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error("Trivy no devolvió salida JSON.");
  }

  let report: TrivyReportJson;
  try {
    report = JSON.parse(trimmed) as TrivyReportJson;
  } catch {
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error("No se pudo parsear el reporte JSON de Trivy.");
    }
    report = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as TrivyReportJson;
  }

  const findings: TrivyVulnerabilityFinding[] = [];

  for (const result of report.Results ?? []) {
    const target = result.Target ?? "image";
    for (const vuln of result.Vulnerabilities ?? []) {
      const severity = normalizeSeverity(vuln.Severity);
      if (!isCriticalOrHigh(severity)) {
        continue;
      }

      findings.push({
        vulnerabilityId: vuln.VulnerabilityID?.trim() || "UNKNOWN-ID",
        severity,
        title:
          vuln.Title?.trim() ||
          vuln.Description?.trim()?.slice(0, 120) ||
          "Vulnerabilidad detectada en capa de imagen",
        pkgName: vuln.PkgName?.trim() || "unknown-package",
        installedVersion: vuln.InstalledVersion?.trim() || "n/a",
        target,
      });
    }
  }

  return findings;
}

export function buildContainerApprovedPermissions(): ApprovedPermissions {
  return {
    read_filesystem: false,
    network_access: false,
    allowed_domains: [],
    custom_scripts: {
      enabled: false,
      inline_code_detected: false,
      execution_engines: ["container-runtime"],
    },
  };
}

export function buildContainerDeniedPermissions(): ApprovedPermissions {
  return {
    read_filesystem: false,
    network_access: false,
    allowed_domains: [],
    custom_scripts: {
      enabled: false,
      inline_code_detected: false,
      execution_engines: ["container-runtime"],
    },
  };
}

export function formatTrivySandboxLogs(
  assetName: string,
  imageRef: string,
  findings: TrivyVulnerabilityFinding[],
): string {
  const lines = [
    `> Trivy container scan initiated for ${assetName}`,
    `  Image registry URI: ${imageRef}`,
    `  Scanner: ${TRIVY_IMAGE}`,
    `  Severity filter: CRITICAL, HIGH`,
    `  Docker socket: ${resolveDockerSocketMount().split(":")[0]}`,
    `  Scan UTC: ${new Date().toISOString()}`,
    "",
  ];

  if (findings.length === 0) {
    lines.push(
      "[PASS] trivy: 0 vulnerabilidades CRITICAL o HIGH en capas OS/dependencias",
    );
    lines.push("[PASS] image_integrity: escaneo de capas completado sin hallazgos bloqueantes");
  } else {
    lines.push(
      `[FAIL] trivy: ${findings.length} vulnerabilidad(es) CRITICAL/HIGH en imagen`,
    );
    lines.push("");

    const maxLines = 80;
    for (const finding of findings.slice(0, maxLines)) {
      lines.push(
        `${finding.vulnerabilityId} [${finding.severity}] - ${finding.title}`,
      );
      lines.push(
        `  Package: ${finding.pkgName} (${finding.installedVersion}) · target: ${finding.target}`,
      );
    }

    if (findings.length > maxLines) {
      lines.push("");
      lines.push(
        `… ${findings.length - maxLines} hallazgo(s) adicionales omitidos en el extracto`,
      );
    }
  }

  lines.push("");
  lines.push(`Trivy scan complete — asset: ${assetName}`);
  return lines.join("\n");
}

function extractExecOutput(error: unknown): { stdout: string; stderr: string } {
  if (!error || typeof error !== "object") {
    return { stdout: "", stderr: "" };
  }

  const record = error as { stdout?: string | Buffer; stderr?: string | Buffer };
  const stdout =
    typeof record.stdout === "string"
      ? record.stdout
      : record.stdout
        ? record.stdout.toString("utf8")
        : "";
  const stderr =
    typeof record.stderr === "string"
      ? record.stderr
      : record.stderr
        ? record.stderr.toString("utf8")
        : "";

  return { stdout, stderr };
}

export async function runTrivyImageScan(imageRef: string): Promise<string> {
  const socketMount = resolveDockerSocketMount();

  try {
    const { stdout, stderr } = await execFileAsync(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        socketMount,
        TRIVY_IMAGE,
        "image",
        "--format",
        "json",
        "--severity",
        "CRITICAL,HIGH",
        "--timeout",
        "4m0s",
        imageRef,
      ],
      {
        encoding: "utf8",
        maxBuffer: TRIVY_MAX_BUFFER,
        timeout: TRIVY_SCAN_TIMEOUT_MS,
        windowsHide: true,
      },
    );

    const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
    if (!combined && !stdout?.trim()) {
      throw new Error("Trivy no devolvió salida tras el escaneo de imagen.");
    }
    return stdout?.trim() || combined;
  } catch (error) {
    const { stdout, stderr } = extractExecOutput(error);
    const merged = [stdout, stderr].filter(Boolean).join("\n").trim();

    if (merged) {
      try {
        parseTrivyReportJson(merged);
        return merged;
      } catch {
        /* continuar con error original si no es JSON válido */
      }
    }

    const message =
      error instanceof Error ? error.message : "Error desconocido ejecutando Trivy.";
    throw new Error(`Fallo al ejecutar Trivy (${TRIVY_IMAGE}): ${message}`);
  }
}

export async function auditContainerImage(
  assetName: string,
  descriptor: string,
): Promise<TrivyScanOutcome> {
  const imageRef = extractImageRegistryUri(descriptor);
  const rawJson = await runTrivyImageScan(imageRef);
  const findings = parseTrivyReportJson(rawJson);
  const criticalHighCount = findings.length;
  const permisos_aprobados =
    criticalHighCount === 0
      ? buildContainerApprovedPermissions()
      : buildContainerDeniedPermissions();

  return {
    criticalHighCount,
    findings,
    logs_sandbox: formatTrivySandboxLogs(assetName, imageRef, findings),
    permisos_aprobados,
  };
}

export function formatTrivyInfrastructureLogs(
  assetName: string,
  imageRef: string | null,
  errorMessage: string,
  stack?: string,
): string {
  const lines = [
    `> Trivy container scan initiated for ${assetName}`,
    imageRef ? `  Image registry URI: ${imageRef}` : "  Image registry URI: (no resuelta)",
    `  Scanner: ${TRIVY_IMAGE}`,
    `  Scan UTC: ${new Date().toISOString()}`,
    "",
    `[FAIL] trivy_infrastructure: ${errorMessage}`,
    "[FAIL] trivy_infrastructure: La auditoría no se completó (Docker apagado, imagen inexistente en registro o error de red).",
  ];

  if (stack?.trim()) {
    lines.push("");
    lines.push("--- stack técnico ---");
    lines.push(stack.trim());
  }

  return lines.join("\n");
}
