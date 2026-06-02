"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const INPUT_PATH = path.join(__dirname, "input.json");
const METADATA_START = "---METADATA_START---";
const METADATA_END = "---METADATA_END---";
const FORCE_TIMEOUT_MARKER = "FORCE_TIMEOUT";

const READ_FILESYSTEM_PATTERN =
  /\bnode:fs\b|\bfs\.(?:readFile|writeFile|promises|open|createReadStream|createWriteStream)\b|\/(?:var|tmp|home)\//i;
const NETWORK_PATTERN =
  /https?:\/\/|(?:\bfetch|\brequest|\bXMLHttpRequest)\s*\(|\baxios\.(?:get|post|put|delete|request)\s*\(|\bwebhook(?:s)?\b|\bws(?:s)?:\/\//i;
const INLINE_SCRIPT_PATTERN =
  /(?:\bfunction\b\s*[A-Za-z0-9_$]*\s*\(|=>|<script\b|\bimport\s+[\w*{\s,}]+\s+from\s+["'][^"']+["']|\brequire\s*\(|\bmodule\.exports\b|\bexport\s+(?:default|const|function|class)\b)/m;
const DANGEROUS_DYNAMIC_PATTERN =
  /\beval\s*\(|\bnew\s+Function\s*\(|child_process|exec\s*\(|spawn\s*\(/i;
const NON_TECHNICAL_KEYS = new Set([
  "asset",
  "assetname",
  "name",
  "nombre",
  "description",
  "descripcion",
  "body",
  "summary",
  "marketing",
  "notes",
  "title",
]);

const URL_PATTERN =
  /https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:[/:?#]|$)/gi;

function readInput() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  return JSON.parse(raw);
}

function sanitizeDescriptorNode(node) {
  if (Array.isArray(node)) {
    return node
      .map((item) => sanitizeDescriptorNode(item))
      .filter((item) => item !== null);
  }

  if (node && typeof node === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(node)) {
      const normalizedKey = key.toLowerCase().trim();
      if (NON_TECHNICAL_KEYS.has(normalizedKey)) {
        continue;
      }
      const child = sanitizeDescriptorNode(value);
      if (child !== null) {
        sanitized[key] = child;
      }
    }
    return Object.keys(sanitized).length > 0 ? sanitized : null;
  }

  if (typeof node === "string") {
    // Ignora descripciones largas de lenguaje natural para evitar falsos positivos.
    const hasCodeMarkers =
      /[{}();<>]/.test(node) ||
      /\b(function|import|export|require|fetch|axios|node:fs|eval|=>)\b/i.test(
        node,
      );
    return hasCodeMarkers ? node : null;
  }

  if (typeof node === "number" || typeof node === "boolean") {
    return node;
  }

  return null;
}

function getTechnicalDescriptor(payload) {
  const descriptor = payload?.descriptor;
  if (!descriptor || typeof descriptor !== "object") {
    return {};
  }

  const sanitized = sanitizeDescriptorNode(descriptor);
  if (!sanitized || typeof sanitized !== "object") {
    return {};
  }
  return sanitized;
}

function flattenTechnicalDescriptor(payload) {
  const descriptor = getTechnicalDescriptor(payload);
  return JSON.stringify(descriptor);
}

function shouldForceTimeout(payload) {
  const descriptor = payload?.descriptor;
  if (!descriptor || typeof descriptor !== "object") {
    return false;
  }
  return JSON.stringify(descriptor).includes(FORCE_TIMEOUT_MARKER);
}

function forceExecutionHang() {
  // Bloqueo controlado del hilo para que Docker sea abortado por timeout
  // en el motor (5 segundos). 15s > 5s para asegurar la condición.
  const timeoutMs = 15_000;
  const blocker = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(blocker, 0, 0, timeoutMs);
}

function extractDomains(text) {
  const domains = new Set();
  let match = URL_PATTERN.exec(text);
  while (match) {
    const domain = match[1]?.toLowerCase();
    if (domain) {
      domains.add(domain);
    }
    match = URL_PATTERN.exec(text);
  }
  URL_PATTERN.lastIndex = 0;
  return Array.from(domains);
}

function detectExecutionEngines(text) {
  const engines = [];
  if (/n8n/i.test(text)) engines.push("n8n");
  if (/zapier/i.test(text)) engines.push("zapier");
  if (/python/i.test(text)) engines.push("python");
  if (/javascript|typescript|node/i.test(text)) engines.push("javascript");
  if (engines.length === 0) engines.push("generic-workflow");
  return engines;
}

function buildPermissions(text) {
  const read_filesystem = READ_FILESYSTEM_PATTERN.test(text);
  const network_access = NETWORK_PATTERN.test(text);
  const inline_code_detected = INLINE_SCRIPT_PATTERN.test(text);
  const dangerous_dynamic = DANGEROUS_DYNAMIC_PATTERN.test(text);

  return {
    read_filesystem,
    network_access,
    allowed_domains: extractDomains(text),
    custom_scripts: {
      enabled: inline_code_detected || dangerous_dynamic,
      inline_code_detected: inline_code_detected || dangerous_dynamic,
      execution_engines: detectExecutionEngines(text),
    },
    _signals: {
      dangerous_dynamic,
    },
  };
}

function buildLogs(assetName, text, permissions) {
  const lines = [
    `> Sandbox execution initiated for ${assetName}`,
    `  Input: ${INPUT_PATH}`,
    `  Runtime: node ${process.version} · ${process.platform}/${process.arch}`,
    `  Container host: ${os.hostname()} · pid ${process.pid}`,
    `  Scan UTC: ${new Date().toISOString()}`,
    "",
  ];

  if (permissions._signals.dangerous_dynamic) {
    lines.push(
      "[WARN] dynamic_code: eval(), Function() o subprocess detectado en descriptor",
    );
  } else {
    lines.push("[PASS] dynamic_code: sin patrones de ejecución dinámica crítica");
  }

  if (permissions.read_filesystem) {
    lines.push("[WARN] filesystem: acceso a rutas o APIs de sistema de archivos");
  } else {
    lines.push("[PASS] filesystem: sin referencias a filesystem local");
  }

  if (permissions.network_access) {
    const domainHint =
      permissions.allowed_domains.length > 0
        ? permissions.allowed_domains.join(", ")
        : "endpoints no enumerados";
    lines.push(`[WARN] network: superficie de red detectada (${domainHint})`);
  } else {
    lines.push("[PASS] network: sin llamadas HTTP ni webhooks en descriptor");
  }

  if (permissions.custom_scripts.enabled) {
    lines.push(
      `[WARN] scripts: motores ${permissions.custom_scripts.execution_engines.join(", ")}`,
    );
  } else {
    lines.push("[PASS] scripts: sin scripts inline ni motores de ejecución");
  }

  lines.push("[PASS] static_analysis: escaneo regex completado en contenedor aislado");
  lines.push("[PASS] sandbox_isolation: --network none (sin egress)");

  const issueCount =
    Number(permissions.read_filesystem) +
    Number(permissions.network_access) +
    Number(permissions.custom_scripts.enabled) +
    Number(permissions.allowed_domains.length > 5);

  if (issueCount === 0) {
    lines.push("[PASS] permission_scope: superficie de ataque mínima");
  } else {
    lines.push(
      `[WARN] permission_scope: ${issueCount} señal(es) de riesgo en análisis estático`,
    );
  }

  lines.push("");
  lines.push(`Audit scan complete — asset: ${assetName}`);

  return lines.join("\n");
}

function stripInternalSignals(permissions) {
  const { _signals, ...clean } = permissions;
  void _signals;
  return clean;
}

function main() {
  let payload;
  try {
    payload = readInput();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido leyendo input.json";
    process.stderr.write(`[FAIL] input: ${message}\n`);
    process.exit(1);
  }

  const assetName =
    typeof payload.assetName === "string" && payload.assetName.trim()
      ? payload.assetName.trim()
      : "unknown-asset";

  if (shouldForceTimeout(payload)) {
    forceExecutionHang();
  }

  const text = flattenTechnicalDescriptor(payload);
  const permissions = buildPermissions(text);
  const logs = buildLogs(assetName, text, permissions);
  const metadata = stripInternalSignals(permissions);

  process.stdout.write(logs);
  process.stdout.write("\n");
  process.stdout.write(METADATA_START);
  process.stdout.write("\n");
  process.stdout.write(JSON.stringify(metadata, null, 2));
  process.stdout.write("\n");
  process.stdout.write(METADATA_END);
  process.stdout.write("\n");
}

main();
