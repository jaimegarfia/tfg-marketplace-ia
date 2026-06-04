export type SandboxFailureKind = "infrastructure" | "security";

const INFRA_PATTERNS: RegExp[] = [
  /docker daemon is not running/i,
  /docker_engine/i,
  /cannot connect to the docker daemon/i,
  /fallo al ejecutar el sandbox docker/i,
  /el contenedor certia-sandbox no devolvió/i,
  /unable to find image/i,
  /pull access denied/i,
  /npm run sandbox:build/i,
  /superó el límite de seguridad \(5000ms\)/i,
  /stdout maxbuffer/i,
  /command failed:\s*docker run/i,
];

/** Indica si el fallo viene del entorno (Docker, imagen, timeout), no del descriptor. */
export function isInfrastructureSandboxFailure(logs: string): boolean {
  return INFRA_PATTERNS.some((pattern) => pattern.test(logs));
}

export function classifySandboxFailure(logs: string): SandboxFailureKind {
  return isInfrastructureSandboxFailure(logs) ? "infrastructure" : "security";
}

/** Extrae líneas [FAIL] del log del sandbox para mostrar causas legibles. */
export function extractSandboxFailureReasons(logs: string): string[] {
  const reasons = logs
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("[FAIL]"))
    .map((line) => line.replace(/^\[FAIL\]\s*/i, ""));

  return reasons.length > 0 ? reasons : [];
}

export function getInfrastructureFailureHint(logs: string): string | null {
  if (/docker daemon|docker_engine|cannot connect to the docker/i.test(logs)) {
    return "Docker Desktop no está en ejecución. Ábrelo en Windows, espera a que indique «Running» y vuelve a enviar la auditoría.";
  }
  if (/unable to find image|pull access denied/i.test(logs)) {
    return "Falta la imagen del sandbox. En la raíz del proyecto ejecuta: npm run sandbox:build";
  }
  if (/superó el límite de seguridad/i.test(logs)) {
    return "El contenedor tardó demasiado. Comprueba que Docker responde o reinicia Docker Desktop.";
  }
  return "No se pudo ejecutar el motor de auditoría en tu máquina. Revisa los logs y la documentación en docs/env-setup.md.";
}
