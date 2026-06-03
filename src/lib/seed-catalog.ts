import type {
  CategoriaAgente,
  EstadoAuditoria,
  TipoActivo,
} from "@/types/database";

export interface SeedDeveloper {
  email: string;
  nombre: string;
}

export interface SeedAgentInput {
  nombre: string;
  descripcion: string;
  version: string;
  precio_usd: number;
  tipo_activo: TipoActivo;
  categoria: CategoriaAgente;
  imagen_url: string | null;
  rating_promedio: number;
  num_valoraciones: number;
  estado_auditoria: EstadoAuditoria;
  hash_integridad: string | null;
  firma_digital: string | null;
  developer_email: string;
  audit_logs?: string;
}

export const SEED_DEVELOPERS: readonly SeedDeveloper[] = [
  { email: "labs@certia.local", nombre: "Certia Labs" },
  { email: "nova@certia.local", nombre: "Nova AI Studio" },
  { email: "secureflow@certia.local", nombre: "SecureFlow Systems" },
  { email: "datapulse@certia.local", nombre: "DataPulse Analytics" },
  { email: "compliancehub@certia.local", nombre: "ComplianceHub EU" },
  { email: "automata@certia.local", nombre: "Automata Works" },
] as const;

function hashFor(name: string): string {
  let out = "";
  for (let i = 0; i < 64; i += 1) {
    out += ((name.charCodeAt(i % name.length) * 17 + i * 31) % 16).toString(16);
  }
  return out;
}

function agent(
  partial: Omit<
    SeedAgentInput,
    "hash_integridad" | "firma_digital" | "imagen_url"
  > & { imagen_url?: string | null },
): SeedAgentInput {
  const certificado = partial.estado_auditoria === "certificado";
  return {
    imagen_url: partial.imagen_url ?? null,
    hash_integridad: certificado ? hashFor(partial.nombre) : null,
    firma_digital: certificado
      ? `sig_ed25519_${partial.nombre.toLowerCase().replace(/\s+/g, "_").slice(0, 24)}`
      : null,
    ...partial,
  };
}

export const SEED_AGENTS: readonly SeedAgentInput[] = [
  // RAG
  agent({
    nombre: "Sentinel RAG",
    descripcion:
      "Recuperación aumentada con aislamiento de contexto y trazabilidad de fuentes para entornos regulados.",
    version: "2.4.1",
    precio_usd: 149,
    tipo_activo: "runtime_artifact",
    categoria: "rag",
    rating_promedio: 4.8,
    num_valoraciones: 127,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
  agent({
    nombre: "ContextVault RAG",
    descripcion:
      "RAG empresarial con vault cifrado, control de acceso por documento y auditoría de consultas.",
    version: "3.0.1",
    precio_usd: 179,
    tipo_activo: "runtime_artifact",
    categoria: "rag",
    rating_promedio: 4.4,
    num_valoraciones: 65,
    estado_auditoria: "certificado",
    developer_email: "nova@certia.local",
  }),
  agent({
    nombre: "LegalDoc Retrieval",
    descripcion:
      "Agente RAG especializado en contratos legales con citación obligatoria de cláusulas y páginas.",
    version: "1.6.0",
    precio_usd: 219,
    tipo_activo: "runtime_artifact",
    categoria: "rag",
    rating_promedio: 4.6,
    num_valoraciones: 38,
    estado_auditoria: "certificado",
    developer_email: "compliancehub@certia.local",
  }),
  agent({
    nombre: "MedRAG Clinical",
    descripcion:
      "Consulta sobre historiales clínicos anonimizados con políticas HIPAA y registro de acceso.",
    version: "2.1.3",
    precio_usd: 399,
    tipo_activo: "runtime_artifact",
    categoria: "rag",
    rating_promedio: 4.9,
    num_valoraciones: 22,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "OpenKnowledge Starter",
    descripcion:
      "Plantilla RAG open-source para equipos que empiezan con bases vectoriales y evaluación básica.",
    version: "1.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "rag",
    rating_promedio: 4.1,
    num_valoraciones: 203,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
  agent({
    nombre: "WikiSync Agent",
    descripcion:
      "Sincroniza wikis internas con embeddings incrementales y detección de documentos obsoletos.",
    version: "1.3.2",
    precio_usd: 89,
    tipo_activo: "runtime_artifact",
    categoria: "rag",
    rating_promedio: 4.2,
    num_valoraciones: 54,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),

  // Automatización
  agent({
    nombre: "InvoiceBot Pro",
    descripcion:
      "Procesamiento de facturas con OCR, validación fiscal y conciliación automática con ERP.",
    version: "1.5.2",
    precio_usd: 59,
    tipo_activo: "runtime_artifact",
    categoria: "automatizacion",
    rating_promedio: 4.1,
    num_valoraciones: 112,
    estado_auditoria: "certificado",
    developer_email: "automata@certia.local",
  }),
  agent({
    nombre: "TicketFlow Resolver",
    descripcion:
      "Clasifica y resuelve tickets de soporte N1 con escalado inteligente y plantillas auditables.",
    version: "2.0.0",
    precio_usd: 129,
    tipo_activo: "runtime_artifact",
    categoria: "automatizacion",
    rating_promedio: 4.3,
    num_valoraciones: 87,
    estado_auditoria: "certificado",
    developer_email: "automata@certia.local",
  }),
  agent({
    nombre: "HR Onboarding Bot",
    descripcion:
      "Automatiza altas de empleados, firma documental y provisioning de accesos corporativos.",
    version: "1.2.8",
    precio_usd: 99,
    tipo_activo: "runtime_artifact",
    categoria: "automatizacion",
    rating_promedio: 4.0,
    num_valoraciones: 46,
    estado_auditoria: "certificado",
    developer_email: "nova@certia.local",
  }),
  agent({
    nombre: "ProcureBot",
    descripcion:
      "Gestiona solicitudes de compra, comparativas de proveedores y aprobaciones multinivel.",
    version: "3.4.1",
    precio_usd: 189,
    tipo_activo: "runtime_artifact",
    categoria: "automatizacion",
    rating_promedio: 4.5,
    num_valoraciones: 31,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
  agent({
    nombre: "Email Triage Agent",
    descripcion:
      "Prioriza bandejas compartidas, extrae acciones y redacta borradores con tono corporativo.",
    version: "1.8.5",
    precio_usd: 49,
    tipo_activo: "runtime_artifact",
    categoria: "automatizacion",
    rating_promedio: 3.9,
    num_valoraciones: 156,
    estado_auditoria: "certificado",
    developer_email: "automata@certia.local",
  }),
  agent({
    nombre: "Workflow Blueprint Kit",
    descripcion:
      "Arquitectura de referencia para automatizar procesos con human-in-the-loop y SLA tracking.",
    version: "1.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "automatizacion",
    rating_promedio: 4.4,
    num_valoraciones: 91,
    estado_auditoria: "certificado",
    developer_email: "automata@certia.local",
  }),
  agent({
    nombre: "CRM Sync Automator",
    descripcion:
      "Mantiene CRM y helpdesk sincronizados con resolución de conflictos y deduplicación.",
    version: "2.3.0",
    precio_usd: 79,
    tipo_activo: "runtime_artifact",
    categoria: "automatizacion",
    rating_promedio: 4.2,
    num_valoraciones: 67,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),

  // Finanzas
  agent({
    nombre: "Ledger Guardian",
    descripcion:
      "Conciliación financiera con verificación criptográfica de salidas y registro inmutable.",
    version: "3.1.7",
    precio_usd: 299,
    tipo_activo: "runtime_artifact",
    categoria: "finanzas",
    rating_promedio: 4.9,
    num_valoraciones: 89,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
  agent({
    nombre: "RiskAnalyzer AI",
    descripcion:
      "Scoring crediticio con modelos explicables y trazabilidad regulatoria MiFID II.",
    version: "2.7.4",
    precio_usd: 349,
    tipo_activo: "runtime_artifact",
    categoria: "finanzas",
    rating_promedio: 4.8,
    num_valoraciones: 44,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "FX Hedge Assistant",
    descripcion:
      "Monitoriza exposición cambiaria y propone coberturas con simulación de escenarios.",
    version: "1.4.0",
    precio_usd: 259,
    tipo_activo: "runtime_artifact",
    categoria: "finanzas",
    rating_promedio: 4.3,
    num_valoraciones: 19,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),
  agent({
    nombre: "Expense Audit Agent",
    descripcion:
      "Valida notas de gasto contra políticas internas y detecta duplicados o importes anómalos.",
    version: "2.2.1",
    precio_usd: 69,
    tipo_activo: "runtime_artifact",
    categoria: "finanzas",
    rating_promedio: 4.0,
    num_valoraciones: 73,
    estado_auditoria: "certificado",
    developer_email: "automata@certia.local",
  }),
  agent({
    nombre: "Treasury Flow Architect",
    descripcion:
      "Arquitectura de referencia para tesorería con límites de aprobación y trazas ACID.",
    version: "1.1.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "finanzas",
    rating_promedio: 4.6,
    num_valoraciones: 15,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
  agent({
    nombre: "Tax Compliance Bot",
    descripcion:
      "Prepara declaraciones trimestrales con validación de series contables y alertas de inconsistencia.",
    version: "4.0.2",
    precio_usd: 199,
    tipo_activo: "runtime_artifact",
    categoria: "finanzas",
    rating_promedio: 4.5,
    num_valoraciones: 28,
    estado_auditoria: "certificado",
    developer_email: "compliancehub@certia.local",
  }),

  // Compliance
  agent({
    nombre: "Compliance Sentinel",
    descripcion:
      "Monitor GDPR/SOX con alertas en tiempo real y trazabilidad de decisiones automatizadas.",
    version: "1.8.0",
    precio_usd: 199,
    tipo_activo: "runtime_artifact",
    categoria: "compliance",
    rating_promedio: 4.6,
    num_valoraciones: 56,
    estado_auditoria: "certificado",
    developer_email: "compliancehub@certia.local",
  }),
  agent({
    nombre: "KYC Validator",
    descripcion:
      "Verifica identidad de clientes con listas OFAC/PEP y registro de evidencias auditables.",
    version: "2.5.0",
    precio_usd: 279,
    tipo_activo: "runtime_artifact",
    categoria: "compliance",
    rating_promedio: 4.7,
    num_valoraciones: 41,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Policy Drift Monitor",
    descripcion:
      "Detecta desviaciones respecto a políticas internas en descriptores de agentes desplegados.",
    version: "1.0.4",
    precio_usd: 149,
    tipo_activo: "runtime_artifact",
    categoria: "compliance",
    rating_promedio: 4.4,
    num_valoraciones: 33,
    estado_auditoria: "certificado",
    developer_email: "compliancehub@certia.local",
  }),
  agent({
    nombre: "Audit Trail Builder",
    descripcion:
      "Genera trails de cumplimiento exportables para auditorías externas e inspecciones regulatorias.",
    version: "3.2.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "compliance",
    rating_promedio: 4.3,
    num_valoraciones: 58,
    estado_auditoria: "certificado",
    developer_email: "compliancehub@certia.local",
  }),
  agent({
    nombre: "Consent Manager AI",
    descripcion:
      "Gestiona consentimientos de usuarios, expiraciones y revocaciones con prueba documental.",
    version: "1.7.1",
    precio_usd: 119,
    tipo_activo: "runtime_artifact",
    categoria: "compliance",
    rating_promedio: 4.1,
    num_valoraciones: 47,
    estado_auditoria: "certificado",
    developer_email: "nova@certia.local",
  }),

  // Orquestación
  agent({
    nombre: "Multi-Agent Hub",
    descripcion:
      "Coordina flotas de agentes con balanceo de carga, circuit breakers y cuotas por tenant.",
    version: "2.1.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "orquestacion",
    rating_promedio: 4.5,
    num_valoraciones: 98,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
  agent({
    nombre: "FlowOps Orchestrator",
    descripcion:
      "Orquesta agentes multi-paso con presupuestos de tokens, fallback y métricas de latencia.",
    version: "1.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "orquestacion",
    rating_promedio: 4.2,
    num_valoraciones: 34,
    estado_auditoria: "en_auditoria",
    developer_email: "nova@certia.local",
  }),
  agent({
    nombre: "Agent Router Pro",
    descripcion:
      "Enruta peticiones al agente óptimo según coste, latencia y nivel de certificación requerido.",
    version: "2.8.0",
    precio_usd: 159,
    tipo_activo: "runtime_artifact",
    categoria: "orquestacion",
    rating_promedio: 4.6,
    num_valoraciones: 52,
    estado_auditoria: "certificado",
    developer_email: "nova@certia.local",
  }),
  agent({
    nombre: "Pipeline Supervisor",
    descripcion:
      "Supervisa DAGs de agentes con reintentos, compensaciones y checkpoints persistentes.",
    version: "1.9.4",
    precio_usd: 139,
    tipo_activo: "runtime_artifact",
    categoria: "orquestacion",
    rating_promedio: 4.4,
    num_valoraciones: 36,
    estado_auditoria: "certificado",
    developer_email: "automata@certia.local",
  }),
  agent({
    nombre: "Event Mesh Connector",
    descripcion:
      "Conecta agentes a buses de eventos con esquemas versionados y dead-letter queues.",
    version: "3.0.0",
    precio_usd: 169,
    tipo_activo: "runtime_artifact",
    categoria: "orquestacion",
    rating_promedio: 4.3,
    num_valoraciones: 24,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),

  // Datos
  agent({
    nombre: "DataPipe ETL Agent",
    descripcion:
      "Pipelines ETL con validación de esquemas, calidad de datos y rollback transaccional.",
    version: "2.0.3",
    precio_usd: 79,
    tipo_activo: "runtime_artifact",
    categoria: "datos",
    rating_promedio: 4.3,
    num_valoraciones: 61,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),
  agent({
    nombre: "Schema Guard",
    descripcion:
      "Valida cambios de esquema en warehouses y bloquea despliegues que rompan contratos de datos.",
    version: "1.5.0",
    precio_usd: 109,
    tipo_activo: "runtime_artifact",
    categoria: "datos",
    rating_promedio: 4.5,
    num_valoraciones: 29,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),
  agent({
    nombre: "Anonymizer Pipeline",
    descripcion:
      "Anonimiza datasets con k-anonymity configurable y informes de reidentificación.",
    version: "2.4.2",
    precio_usd: 149,
    tipo_activo: "runtime_artifact",
    categoria: "datos",
    rating_promedio: 4.7,
    num_valoraciones: 42,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Lakehouse Sync",
    descripcion:
      "Sincroniza lakehouse y OLTP con CDC, deduplicación y métricas de frescura.",
    version: "1.1.6",
    precio_usd: 199,
    tipo_activo: "runtime_artifact",
    categoria: "datos",
    rating_promedio: 4.2,
    num_valoraciones: 18,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),
  agent({
    nombre: "Data Quality Starter",
    descripcion:
      "Kit de referencia para reglas de calidad, profiling y alertas en pipelines de datos.",
    version: "1.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "datos",
    rating_promedio: 4.0,
    num_valoraciones: 77,
    estado_auditoria: "certificado",
    developer_email: "datapulse@certia.local",
  }),

  // Seguridad
  agent({
    nombre: "SecureOps Scanner",
    descripcion:
      "Análisis de vulnerabilidades en descriptores de IA con scoring CVSS y remediación sugerida.",
    version: "4.2.0",
    precio_usd: 249,
    tipo_activo: "runtime_artifact",
    categoria: "seguridad",
    rating_promedio: 4.7,
    num_valoraciones: 73,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Threat Intel Correlator",
    descripcion:
      "Correlaciona IOCs con telemetría de agentes y prioriza respuestas automáticas contenidas.",
    version: "2.0.8",
    precio_usd: 289,
    tipo_activo: "runtime_artifact",
    categoria: "seguridad",
    rating_promedio: 4.8,
    num_valoraciones: 35,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Sandbox Policy Enforcer",
    descripcion:
      "Aplica políticas de ejecución en sandboxes aislados con informes de violación detallados.",
    version: "3.3.1",
    precio_usd: 319,
    tipo_activo: "runtime_artifact",
    categoria: "seguridad",
    rating_promedio: 4.9,
    num_valoraciones: 27,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Secrets Rotation Agent",
    descripcion:
      "Rota credenciales de integraciones de agentes con ventanas de gracia y rollback seguro.",
    version: "1.6.3",
    precio_usd: 179,
    tipo_activo: "runtime_artifact",
    categoria: "seguridad",
    rating_promedio: 4.4,
    num_valoraciones: 49,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Zero Trust Blueprint",
    descripcion:
      "Arquitectura de referencia zero-trust para despliegue de agentes con mínimo privilegio.",
    version: "2.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    categoria: "seguridad",
    rating_promedio: 4.6,
    num_valoraciones: 84,
    estado_auditoria: "certificado",
    developer_email: "secureflow@certia.local",
  }),
  agent({
    nombre: "Prompt Injection Shield",
    descripcion:
      "Filtra intentos de jailbreak e inyección en runtime con reglas heurísticas y ML ligero.",
    version: "1.2.0",
    precio_usd: 99,
    tipo_activo: "runtime_artifact",
    categoria: "seguridad",
    rating_promedio: 4.1,
    num_valoraciones: 118,
    estado_auditoria: "certificado",
    developer_email: "labs@certia.local",
  }),
] as const;

export const DEFAULT_AUDIT_LOGS = `[INFO] Sandbox iniciado — modo aislado sin red
[PASS] Análisis estático del descriptor completado
[PASS] Permisos de ejecución dentro de política
[PASS] Hash de integridad verificado
[INFO] Auditoría finalizada — activo apto para catálogo`;
