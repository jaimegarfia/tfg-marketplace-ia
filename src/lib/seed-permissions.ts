import type { ApprovedPermissions } from "@/lib/audit-engine";
import type { CategoriaAgente } from "@/types/database";

const LOCKED: ApprovedPermissions = {
  read_filesystem: false,
  network_access: false,
  allowed_domains: [],
  custom_scripts: {
    enabled: false,
    inline_code_detected: false,
    execution_engines: ["none"],
  },
};

function perm(
  partial: Partial<ApprovedPermissions> & {
    custom_scripts?: Partial<ApprovedPermissions["custom_scripts"]>;
  },
): ApprovedPermissions {
  return {
    read_filesystem: partial.read_filesystem ?? false,
    network_access: partial.network_access ?? false,
    allowed_domains: partial.allowed_domains ?? [],
    custom_scripts: {
      enabled: partial.custom_scripts?.enabled ?? false,
      inline_code_detected: partial.custom_scripts?.inline_code_detected ?? false,
      execution_engines:
        partial.custom_scripts?.execution_engines ?? ["none"],
    },
  };
}

/** Permisos de auditoría demo variados por agente (JSONB `permisos_aprobados`). */
const PERMISSIONS_BY_AGENT: Record<string, ApprovedPermissions> = {
  "Sentinel RAG": perm({
    network_access: true,
    allowed_domains: ["api.openai.com", "vectors.certia.internal"],
  }),
  "ContextVault RAG": perm({
    network_access: true,
    allowed_domains: ["vault.certia.internal", "embeddings.azure.com"],
    read_filesystem: true,
  }),
  "LegalDoc Retrieval": perm({
    network_access: true,
    allowed_domains: ["clm.legalcorp.eu"],
    read_filesystem: true,
  }),
  "MedRAG Clinical": perm({
    network_access: true,
    allowed_domains: ["ehr.hospital.internal"],
    read_filesystem: true,
  }),
  "OpenKnowledge Starter": LOCKED,
  "WikiSync Agent": perm({
    network_access: true,
    allowed_domains: ["wiki.corp.internal"],
  }),

  "InvoiceBot Pro": perm({
    read_filesystem: true,
    network_access: true,
    allowed_domains: ["erp.sap.internal"],
  }),
  "TicketFlow Resolver": perm({
    network_access: true,
    allowed_domains: ["zendesk.internal", "slack.com"],
  }),
  "HR Onboarding Bot": perm({
    network_access: true,
    allowed_domains: ["hris.workday.com"],
    read_filesystem: true,
  }),
  "ProcureBot": perm({
    network_access: true,
    allowed_domains: ["procurement.corp.internal"],
  }),
  "Email Triage Agent": perm({
    network_access: true,
    allowed_domains: ["outlook.office365.com"],
  }),
  "Workflow Blueprint Kit": LOCKED,
  "CRM Sync Automator": perm({
    network_access: true,
    allowed_domains: ["salesforce.com", "hubspot.com"],
  }),

  "Ledger Guardian": perm({
    network_access: true,
    allowed_domains: ["ledger.bank.api"],
  }),
  "RiskAnalyzer AI": perm({
    network_access: true,
    allowed_domains: ["credit.bureau.eu"],
  }),
  "FX Hedge Assistant": perm({
    network_access: true,
    allowed_domains: ["bloomberg.api", "ecb.europa.eu"],
  }),
  "Expense Audit Agent": perm({ read_filesystem: true }),
  "Treasury Flow Architect": LOCKED,
  "Tax Compliance Bot": perm({
    network_access: true,
    allowed_domains: ["aeat.gob.es"],
    read_filesystem: true,
  }),

  "Compliance Sentinel": LOCKED,
  "KYC Validator": perm({
    network_access: true,
    allowed_domains: ["ofac.treasury.gov", "pep-registry.eu"],
  }),
  "Policy Drift Monitor": perm({
    custom_scripts: {
      enabled: true,
      inline_code_detected: false,
      execution_engines: ["policy-engine"],
    },
  }),
  "Audit Trail Builder": LOCKED,
  "Consent Manager AI": perm({
    network_access: true,
    allowed_domains: ["consent.cmp.eu"],
  }),

  "Multi-Agent Hub": perm({
    network_access: true,
    allowed_domains: ["orchestrator.certia.internal"],
  }),
  "Agent Router Pro": perm({
    network_access: true,
    allowed_domains: ["router.certia.internal", "metrics.datadoghq.com"],
  }),
  "Pipeline Supervisor": perm({
    network_access: true,
    allowed_domains: ["temporal.io"],
    custom_scripts: {
      enabled: true,
      inline_code_detected: true,
      execution_engines: ["node", "python"],
    },
  }),
  "Event Mesh Connector": perm({
    network_access: true,
    allowed_domains: ["kafka.internal", "rabbitmq.internal"],
  }),

  "DataPipe ETL Agent": perm({
    read_filesystem: true,
    network_access: true,
    allowed_domains: ["s3.amazonaws.com"],
  }),
  "Schema Guard": LOCKED,
  "Anonymizer Pipeline": perm({
    read_filesystem: true,
    custom_scripts: {
      enabled: true,
      inline_code_detected: false,
      execution_engines: ["python"],
    },
  }),
  "Lakehouse Sync": perm({
    read_filesystem: true,
    network_access: true,
    allowed_domains: ["databricks.com", "snowflake.com"],
  }),
  "Data Quality Starter": LOCKED,

  "SecureOps Scanner": perm({
    custom_scripts: {
      enabled: true,
      inline_code_detected: true,
      execution_engines: ["static-analyzer"],
    },
  }),
  "Threat Intel Correlator": perm({
    network_access: true,
    allowed_domains: ["misp.internal", "virustotal.com"],
  }),
  "Sandbox Policy Enforcer": LOCKED,
  "Secrets Rotation Agent": perm({
    network_access: true,
    allowed_domains: ["vault.hashicorp.com"],
  }),
  "Zero Trust Blueprint": LOCKED,
  "Prompt Injection Shield": perm({
    custom_scripts: {
      enabled: true,
      inline_code_detected: false,
      execution_engines: ["wasm-sandbox"],
    },
  }),
};

const CATEGORY_DEFAULTS: Record<CategoriaAgente, ApprovedPermissions> = {
  rag: perm({ network_access: true, allowed_domains: ["api.llm.provider"] }),
  automatizacion: perm({
    network_access: true,
    allowed_domains: ["workflow.internal"],
  }),
  finanzas: perm({ network_access: true, allowed_domains: ["finance.api"] }),
  compliance: LOCKED,
  orquestacion: perm({
    network_access: true,
    allowed_domains: ["mesh.internal"],
  }),
  datos: perm({ read_filesystem: true }),
  seguridad: perm({
    custom_scripts: {
      enabled: true,
      inline_code_detected: false,
      execution_engines: ["scanner"],
    },
  }),
};

export function resolveSeedPermissions(input: {
  nombre: string;
  categoria: CategoriaAgente;
}): ApprovedPermissions {
  return (
    PERMISSIONS_BY_AGENT[input.nombre] ??
    CATEGORY_DEFAULTS[input.categoria] ??
    LOCKED
  );
}

export { LOCKED as DEFAULT_SEED_PERMISSIONS };
