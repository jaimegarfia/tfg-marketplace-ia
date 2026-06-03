import type { ApprovedPermissions } from "@/lib/audit-engine";
import type { AgenteConAuditoria, CategoriaAgente } from "@/types/database";

export interface DeploymentCodeBlock {
  label: string;
  code: string;
}

export interface DeploymentGuideContent {
  variant: "runtime_artifact" | "reference_architecture";
  title: string;
  description: string;
  primaryBlock: DeploymentCodeBlock;
  secondaryBlock?: DeploymentCodeBlock;
  steps: readonly string[];
  notes: readonly string[];
}

function slugifyAgentName(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface RuntimeProfile {
  port: number;
  dockerFlags: string;
  envLines: string[];
  description: string;
  notes: string[];
}

const RUNTIME_BY_CATEGORIA: Record<CategoriaAgente, RuntimeProfile> = {
  rag: {
    port: 8090,
    dockerFlags: "-v certia-rag-cache:/var/cache/certia",
    envLines: [
      "VECTOR_STORE_URL=",
      "EMBEDDING_MODEL=text-embedding-3-small",
      "RAG_TOP_K=8",
    ],
    description:
      "Contenedor de inferencia RAG. Monta un volumen de caché local para embeddings y conecta tu vector store corporativo sin exponer documentos al registro público.",
    notes: [
      "El puerto expone la API de consulta aumentada en localhost.",
      "Configura VECTOR_STORE_URL apuntando a tu instancia privada (pgvector, Qdrant, etc.).",
    ],
  },
  automatizacion: {
    port: 8081,
    dockerFlags: "",
    envLines: [
      "WEBHOOK_SECRET=",
      "CERTIA_CALLBACK_URL=",
      "QUEUE_BACKEND=redis://localhost:6379",
    ],
    description:
      "Runtime de automatización event-driven. El contenedor expone webhooks locales para orquestar flujos sin depender de SaaS externos.",
    notes: [
      "Registra WEBHOOK_SECRET en tu vault antes de activar triggers.",
      "Ideal para despliegue en VPC con cola Redis o RabbitMQ interna.",
    ],
  },
  finanzas: {
    port: 8443,
    dockerFlags: "--cap-drop=ALL",
    envLines: [
      "LEDGER_API_URL=",
      "CERTIA_AUDIT_LOG=/var/log/certia/ledger.log",
      "TLS_CLIENT_CERT=/run/secrets/certia-tls.pem",
    ],
    description:
      "Artefacto financiero certificado con superficie de ataque reducida. Ejecútalo con capacidades Linux mínimas y trazabilidad de operaciones contables.",
    notes: [
      "Se recomienda terminar TLS en un reverse proxy corporativo.",
      "Los logs de auditoría deben persistirse en volumen cifrado.",
    ],
  },
  compliance: {
    port: 8082,
    dockerFlags: "-v ./audit-trail:/var/log/certia:rw",
    envLines: [
      "POLICY_ENGINE_URL=",
      "RETENTION_DAYS=2555",
      "CERTIA_COMPLIANCE_PROFILE=eu-gdpr",
    ],
    description:
      "Motor de compliance desplegable on-premise. Persiste el audit trail en filesystem local bajo políticas de retención configurables.",
    notes: [
      "Monta ./audit-trail en almacenamiento WORM o bucket inmutable.",
      "Ajusta RETENTION_DAYS según tu marco regulatorio.",
    ],
  },
  orquestacion: {
    port: 9090,
    dockerFlags: "--network certia-orchestration",
    envLines: [
      "ORCHESTRATOR_PEERS=",
      "CERTIA_SERVICE_MESH=linkerd",
      "HEALTH_CHECK_INTERVAL=30s",
    ],
    description:
      "Nodo de orquestación multi-agente. Conéctalo a una red Docker dedicada para coordinar workers sin salida a Internet.",
    notes: [
      "Crea la red con: docker network create certia-orchestration",
      "Expone métricas Prometheus en /metrics del puerto asignado.",
    ],
  },
  datos: {
    port: 8080,
    dockerFlags: "-v ./datasets:/data:ro",
    envLines: [
      "DATASET_PATH=/data",
      "OUTPUT_SINK=/data/anonymized",
      "K_ANONYMITY=5",
    ],
    description:
      "Pipeline de datos certificado. Monta datasets locales en solo lectura; las transformaciones y salidas permanecen en tu perímetro.",
    notes: [
      "El volumen ./datasets debe contener únicamente datos autorizados para el entorno.",
      "Ajusta K_ANONYMITY según la política de privacidad de tu organización.",
    ],
  },
  seguridad: {
    port: 8083,
    dockerFlags: "--read-only --tmpfs /tmp:rw,noexec",
    envLines: [
      "THREAT_INTEL_FEED=",
      "CERTIA_ISOLATION_MODE=strict",
      "SANDBOX_PROFILE=certia-v1",
    ],
    description:
      "Artefacto de seguridad con filesystem de solo lectura. Ejecútalo en modo estricto para análisis de amenazas sin persistencia mutable.",
    notes: [
      "El flag --read-only impide escrituras fuera de /tmp efímero.",
      "Valida la firma digital del registro antes de elevar privilegios.",
    ],
  },
};

interface BlueprintProfile {
  platformHint: string;
  envLines: string[];
  description: string;
  steps: string[];
  notes: string[];
}

const BLUEPRINT_BY_CATEGORIA: Record<CategoriaAgente, BlueprintProfile> = {
  rag: {
    platformHint: "n8n (recomendado para pipelines documentales)",
    envLines: [
      "OPENAI_API_KEY=",
      "VECTOR_DB_CONNECTION=",
      "CERTIA_AGENT_ID=",
      "DOCUMENT_INGEST_PATH=",
    ],
    description:
      "Blueprint de arquitectura RAG para importar en iPaaS. Indexa documentos en tu vector store privado sin replicar contenido en Certia.",
    steps: [
      "Importa el JSON en n8n: Workflows → Import from file.",
      "Configura DOCUMENT_INGEST_PATH hacia tu share corporativo.",
      "Ejecuta el nodo de validación Certia antes de activar producción.",
    ],
    notes: [
      "No incluyas documentos reales en el blueprint exportado.",
      "El flujo asume embeddings vía API; puedes sustituir por modelo local.",
    ],
  },
  automatizacion: {
    platformHint: "Zapier o Make (integraciones SaaS)",
    envLines: [
      "OPENAI_API_KEY=",
      "CERTIA_AUTH_TOKEN=",
      "CERTIA_AGENT_ID=",
      "CERTIA_WEBHOOK_URL=",
      "SLACK_BOT_TOKEN=",
    ],
    description:
      "Flujo de automatización listo para Zapier/Make. Conecta triggers externos manteniendo credenciales en tu vault.",
    steps: [
      "Descarga el blueprint certificado desde el panel de adquisición.",
      "En Zapier: Create Zap → Import template JSON certificada.",
      "Mapea SLACK_BOT_TOKEN y WEBHOOK_URL a secretos de tu organización.",
    ],
    notes: [
      "Cada trigger debe apuntar a endpoints en tu dominio, no a Certia.",
    ],
  },
  finanzas: {
    platformHint: "n8n self-hosted (conexión ERP)",
    envLines: [
      "ERP_SAP_ENDPOINT=",
      "CERTIA_AUTH_TOKEN=",
      "CERTIA_AGENT_ID=",
      "PAYMENT_GATEWAY_KEY=",
    ],
    description:
      "Arquitectura de referencia para conciliación y reporting financiero. Despliega en n8n dentro de tu VPC bancaria.",
    steps: [
      "Importa en n8n self-hosted con acceso restringido por IP.",
      "Conecta ERP_SAP_ENDPOINT a tu instancia SAP interna.",
      "Activa solo tras revisión del equipo de riesgos.",
    ],
    notes: ["Obligatorio: logs de ejecución en SIEM corporativo."],
  },
  compliance: {
    platformHint: "n8n (auditoría y consentimiento)",
    envLines: [
      "CLM_API_URL=",
      "CERTIA_AUTH_TOKEN=",
      "CERTIA_AGENT_ID=",
      "DPO_NOTIFICATION_EMAIL=",
    ],
    description:
      "Blueprint de gobernanza y consentimiento. Orquesta revisiones legales sin transferir PII a terceros.",
    steps: [
      "Importa el workflow en n8n dentro de región EU.",
      "Configura DPO_NOTIFICATION_EMAIL para alertas automáticas.",
      "Valida CLM_API_URL contra tu contract lifecycle management.",
    ],
    notes: ["Conserva evidencia de ejecución durante el periodo legal aplicable."],
  },
  orquestacion: {
    platformHint: "n8n + workers distribuidos",
    envLines: [
      "OPENAI_API_KEY=",
      "CERTIA_AUTH_TOKEN=",
      "CERTIA_AGENT_ID=",
      "WORKER_QUEUE_URL=",
      "CERTIA_MESH_TOKEN=",
    ],
    description:
      "Arquitectura multi-agente para coordinar workers en infraestructura privada con service mesh.",
    steps: [
      "Despliega n8n en cluster Kubernetes con network policies.",
      "Registra WORKER_QUEUE_URL apuntando a tu cola interna.",
      "Importa el blueprint y enlaza nodos worker por CERTIA_MESH_TOKEN.",
    ],
    notes: ["No expongas WORKER_QUEUE_URL a Internet."],
  },
  datos: {
    platformHint: "n8n (ETL y calidad de datos)",
    envLines: [
      "OPENAI_API_KEY=",
      "CERTIA_AUTH_TOKEN=",
      "CERTIA_AGENT_ID=",
      "CERTIA_PRIVATE_DATA_ENDPOINT=",
      "WAREHOUSE_DSN=",
    ],
    description:
      "Flujo ETL/anonymization como blueprint. Procesa datasets en tu data warehouse sin replicación externa.",
    steps: [
      "Importa en n8n con acceso a WAREHOUSE_DSN (Snowflake, BigQuery, etc.).",
      "Define CERTIA_PRIVATE_DATA_ENDPOINT hacia tu lakehouse interno.",
      "Ejecuta dry-run con datos sintéticos antes de producción.",
    ],
    notes: [
      "El endpoint privado nunca debe ser una URL pública de Certia.",
    ],
  },
  seguridad: {
    platformHint: "n8n (SOC automation)",
    envLines: [
      "CERTIA_AUTH_TOKEN=",
      "CERTIA_AGENT_ID=",
      "SIEM_WEBHOOK=",
      "THREAT_INTEL_API_KEY=",
    ],
    description:
      "Blueprint de respuesta a incidentes. Enruta alertas al SIEM corporativo con playbooks pre-auditados.",
    steps: [
      "Importa en n8n desplegado en red de seguridad (DMZ interna).",
      "Configura SIEM_WEBHOOK hacia Splunk, Elastic o QRadar.",
      "Restringe THREAT_INTEL_API_KEY a rotación trimestral.",
    ],
    notes: ["Ejecuta en modo dry-run las primeras 72 h en entorno de staging."],
  },
};

function appendPermissionEnvLines(
  lines: string[],
  permisos: ApprovedPermissions | null,
): string[] {
  const result = [...lines];

  if (permisos?.network_access && permisos.allowed_domains.length > 0) {
    result.push(`CERTIA_ALLOWED_DOMAINS=${permisos.allowed_domains.join(",")}`);
  }

  if (permisos?.read_filesystem) {
    result.push("CERTIA_FS_ACCESS=granted");
  }

  return result;
}

function buildDockerRunCommand(
  agente: AgenteConAuditoria,
  profile: RuntimeProfile,
): string {
  const imageSlug = slugifyAgentName(agente.nombre);
  const image = `certia-registry/${imageSlug}:${agente.version}`;
  const containerName = `certia-${imageSlug}`;
  const portMapping = `-p ${profile.port}:${profile.port}`;
  const flags = profile.dockerFlags.trim();

  const parts = [
    "docker run",
    `--name ${containerName}`,
    "-d",
    portMapping,
    flags,
    image,
  ].filter(Boolean);

  return parts.join(" \\\n  ");
}

function buildEnvBlock(lines: string[]): string {
  return lines.join("\n");
}

export function buildDeploymentGuide(
  agente: AgenteConAuditoria,
  permisos: ApprovedPermissions | null,
): DeploymentGuideContent {
  const slug = slugifyAgentName(agente.nombre);

  if (agente.tipo_activo === "runtime_artifact") {
    const profile = RUNTIME_BY_CATEGORIA[agente.categoria];
    const envLines = appendPermissionEnvLines(
      [
        ...profile.envLines,
        `CERTIA_AGENT_ID=${agente.id}`,
        "CERTIA_AUTH_TOKEN=",
      ],
      permisos,
    );

    const hashNote = agente.hash_integridad
      ? `Verifica integridad: certia verify --hash ${agente.hash_integridad.slice(0, 16)}...`
      : "Verifica el hash SHA-256 en la pestaña Inspección Técnica antes de producción.";

    return {
      variant: "runtime_artifact",
      title: "Despliegue local con Docker",
      description: profile.description,
      primaryBlock: {
        label: "Docker run",
        code: buildDockerRunCommand(agente, profile),
      },
      secondaryBlock: {
        label: "Variables de entorno",
        code: buildEnvBlock(envLines),
      },
      steps: [],
      notes: [
        ...profile.notes,
        `Imagen certificada: certia-registry/${slug}:${agente.version}`,
        hashNote,
      ],
    };
  }

  const profile = BLUEPRINT_BY_CATEGORIA[agente.categoria];
  const envLines = appendPermissionEnvLines(
    profile.envLines.map((line) =>
      line === "CERTIA_AGENT_ID=" ? `CERTIA_AGENT_ID=${agente.id}` : line,
    ),
    permisos,
  );

  return {
    variant: "reference_architecture",
    title: `Importación en iPaaS — ${profile.platformHint}`,
    description: profile.description,
    primaryBlock: {
      label: "Blueprint",
      code: `certia-blueprints/${slug}.v${agente.version.replace(/\./g, "_")}.json`,
    },
    secondaryBlock: {
      label: "Variables de entorno requeridas",
      code: buildEnvBlock(envLines),
    },
    steps: profile.steps,
    notes: profile.notes,
  };
}
