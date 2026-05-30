import type { Agente, TipoActivo } from "@/types/database";

/**
 * Datos simulados (in-memory) para la vitrina de la landing. Respetan al 100%
 * la interfaz `Agente`, de modo que sustituirlos por una consulta real a Neon
 * (vía `query<Agente>(...)`) no requiere cambios en la capa de presentación.
 */
export const AGENTES_DESTACADOS: readonly Agente[] = [
  {
    id: "a1f2c3d4-0001-4a10-9b00-000000000001",
    desarrollador_id: "dev-0001",
    nombre: "Sentinel RAG",
    descripcion:
      "Agente de recuperación aumentada con aislamiento de contexto y trazabilidad de fuentes para entornos regulados.",
    version: "2.4.1",
    precio_usd: 149,
    tipo_activo: "runtime_artifact",
    estado_auditoria: "certificado",
    hash_integridad:
      "sha256:9f2c1b7e4a6d8c0f3e5a7b9d1c2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e",
    firma_digital: "ed25519:MIIBI...verified",
    created_at: "2026-04-12T09:24:00.000Z",
  },
  {
    id: "a1f2c3d4-0002-4a10-9b00-000000000002",
    desarrollador_id: "dev-0002",
    nombre: "FlowOps Orchestrator",
    descripcion:
      "Arquitectura de referencia para orquestar agentes multi-paso con cuotas, presupuestos y políticas de fallback.",
    version: "1.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    estado_auditoria: "en_auditoria",
    hash_integridad: null,
    firma_digital: null,
    created_at: "2026-05-02T15:10:00.000Z",
  },
  {
    id: "a1f2c3d4-0003-4a10-9b00-000000000003",
    desarrollador_id: "dev-0003",
    nombre: "Ledger Guardian",
    descripcion:
      "Agente de conciliación financiera con verificación criptográfica de salidas y registro inmutable de decisiones.",
    version: "3.1.7",
    precio_usd: 299,
    tipo_activo: "runtime_artifact",
    estado_auditoria: "certificado",
    hash_integridad:
      "sha256:1a3c5e7f9b0d2f4a6c8e0a2c4e6f8b0d2f4a6c8e0a2c4e6f8b0d2f4a6c8e0a2c",
    firma_digital: "ed25519:MIIBI...verified",
    created_at: "2026-03-28T11:45:00.000Z",
  },
  {
    id: "a1f2c3d4-0004-4a10-9b00-000000000004",
    desarrollador_id: "dev-0004",
    nombre: "Insight Synth",
    descripcion:
      "Generador de informes ejecutivos a partir de fuentes heterogéneas con anonimización de datos sensibles.",
    version: "0.9.2",
    precio_usd: 79,
    tipo_activo: "runtime_artifact",
    estado_auditoria: "borrador",
    hash_integridad: null,
    firma_digital: null,
    created_at: "2026-05-20T08:00:00.000Z",
  },
  {
    id: "a1f2c3d4-0005-4a10-9b00-000000000005",
    desarrollador_id: "dev-0005",
    nombre: "Atlas Router",
    descripcion:
      "Arquitectura de referencia para enrutar peticiones entre modelos optimizando coste, latencia y privacidad.",
    version: "1.2.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    estado_auditoria: "certificado",
    hash_integridad:
      "sha256:7e9a1c3e5f7a9c1e3f5a7c9e1f3a5c7e9a1c3e5f7a9c1e3f5a7c9e1f3a5c7e9a",
    firma_digital: "ed25519:MIIBI...verified",
    created_at: "2026-02-14T17:30:00.000Z",
  },
  {
    id: "a1f2c3d4-0006-4a10-9b00-000000000006",
    desarrollador_id: "dev-0006",
    nombre: "Probe Scanner",
    descripcion:
      "Agente de análisis de seguridad que detecta exfiltración de prompts; rechazado por permisos de red excesivos.",
    version: "0.4.0",
    precio_usd: 0,
    tipo_activo: "runtime_artifact",
    estado_auditoria: "rechazado",
    hash_integridad: null,
    firma_digital: null,
    created_at: "2026-05-25T13:05:00.000Z",
  },
];

const ETIQUETAS_TIPO: Record<TipoActivo, string> = {
  runtime_artifact: "Artefacto ejecutable",
  reference_architecture: "Arquitectura de referencia",
};

export function etiquetaTipoActivo(tipo: TipoActivo): string {
  return ETIQUETAS_TIPO[tipo];
}

export function formatearPrecio(precioUsd: number): string {
  if (precioUsd === 0) return "Gratis";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(precioUsd);
}
