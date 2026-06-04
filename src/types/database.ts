import type { ApprovedPermissions } from "@/lib/audit-engine";

/**
 * Tipos de dominio que mapean EXACTAMENTE el esquema físico relacional de
 * PostgreSQL (Neon). Son la única fuente de verdad para las filas que viajan
 * entre la base de datos y la capa de aplicación.
 *
 * Convenciones:
 *  - Las columnas `*_id`, `id` usan UUID (string) salvo indicación contraria.
 *  - Las marcas temporales (`*_at`, `fecha_*`) se serializan a `string` (ISO 8601)
 *    al cruzar la frontera servidor → cliente.
 *  - Las columnas que admiten NULL en SQL se modelan como `T | null`.
 */

// ----------------------------------------------------------------------------
// Enumeraciones (CHECK constraints / tipos ENUM en PostgreSQL)
// ----------------------------------------------------------------------------

export type RolUsuario =
  | "anonimo"
  | "desarrollador"
  | "empresa"
  | "administrador";

export type TipoActivo = "runtime_artifact" | "reference_architecture";

export type CategoriaAgente =
  | "rag"
  | "automatizacion"
  | "finanzas"
  | "compliance"
  | "orquestacion"
  | "datos"
  | "seguridad";

export type EstadoAuditoria =
  | "borrador"
  | "en_auditoria"
  | "certificado"
  | "rechazado";

export type EstadoPago = "pendiente" | "completado" | "fallido";

export type ResultadoAuditoria = "aprobado" | "rechazado" | "advertencia";

export type EstadoProcesoFineTuning =
  | "solicitado"
  | "en_desarrollo"
  | "entregado"
  | "disputa";

// ----------------------------------------------------------------------------
// Estructuras auxiliares almacenadas como JSONB
// ----------------------------------------------------------------------------

/** Permiso concedido a un agente durante la auditoría en sandbox. */
export interface PermisoAprobado {
  recurso: string;
  alcance: "lectura" | "escritura" | "red" | "ejecucion";
  justificacion: string;
}

/** Vulnerabilidad detectada por el motor de análisis estático/dinámico. */
export interface Vulnerabilidad {
  id: string;
  severidad: "baja" | "media" | "alta" | "critica";
  descripcion: string;
  cwe?: string;
}

// ----------------------------------------------------------------------------
// Tablas
// ----------------------------------------------------------------------------

/** Tabla `usuario`. */
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  avatar_url: string | null;
  password_hash: string | null;
  created_at: string;
}

/** Tabla `agente`. */
export interface Agente {
  id: string;
  desarrollador_id: string;
  nombre: string;
  descripcion: string;
  version: string;
  precio_eur: number;
  tipo_activo: TipoActivo;
  categoria: CategoriaAgente;
  imagen_url: string | null;
  rating_promedio: number;
  num_valoraciones: number;
  estado_auditoria: EstadoAuditoria;
  hash_integridad: string | null;
  firma_digital: string | null;
  created_at: string;
}

export type { ApprovedPermissions };

/** Snapshot de auditoría para el panel lateral (catálogo). */
export interface AuditoriaPanelSnapshot {
  resultado_global: ResultadoAuditoria;
  logs_sandbox: string;
  vulnerabilidades_detectadas: Vulnerabilidad[];
  vulnerabilidades_count: number;
  permisos_aprobados: ApprovedPermissions;
  hash_integridad: string;
  fecha_ejecucion: string;
}

/** Agente enriquecido con datos de auditoría para el panel de inspección. */
export interface AgenteConAuditoria extends Agente {
  auditoria: AuditoriaPanelSnapshot | null;
  desarrollador_nombre?: string;
}

/** Tabla `auditoria`. */
export interface Auditoria {
  id: string;
  agente_id: string;
  resultado_global: ResultadoAuditoria;
  logs_sandbox: string;
  vulnerabilidades_detectadas: Vulnerabilidad[];
  permisos_aprobados: PermisoAprobado[];
  fecha_ejecucion: string;
}

/** Tabla `transaccion`. */
export interface Transaccion {
  id: string;
  empresa_id: string;
  agente_id: string;
  stripe_payment_intent_id: string;
  estado_pago: EstadoPago;
  created_at: string;
}

/** Tabla `valoraciones` (reseñas de compradores en el marketplace). */
export interface Valoracion {
  id: string;
  agente_id: string;
  usuario_nombre: string;
  empresa_nombre: string | null;
  puntuacion: number;
  comentario: string;
  created_at: string;
}

/** Tabla `servicios_fine_tuning`. */
export interface ServicioFineTuning {
  id: string;
  transaccion_id: string;
  contexto_privado_desc: string;
  estado_proceso: EstadoProcesoFineTuning;
  updated_at: string;
}
