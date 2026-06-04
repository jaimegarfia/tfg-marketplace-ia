import { query } from "@/lib/db";
import {
  resolveCatalogAuditoriaFromDatabase,
  type AgenteRowAuditFields,
} from "@/lib/audit-catalog";
import type {
  Agente,
  AgenteConAuditoria,
  CategoriaAgente,
  TipoActivo,
} from "@/types/database";

interface AgenteRowRaw extends AgenteRowAuditFields {
  id: string;
  desarrollador_id: string;
  desarrollador_nombre: string | null;
  nombre: string;
  descripcion: string;
  version: string;
  precio_eur: string | number;
  tipo_activo: TipoActivo;
  categoria: CategoriaAgente | null;
  imagen_url: string | null;
  rating_promedio: string | number | null;
  num_valoraciones: number | null;
  estado_auditoria: Agente["estado_auditoria"];
  hash_integridad: string | null;
  firma_digital: string | null;
  guia_despliegue: string | null;
  admite_adaptacion: boolean | null;
  created_at: string;
}

const CATALOG_QUERY = `
  SELECT
    a.id::text AS id,
    a.desarrollador_id::text AS desarrollador_id,
    COALESCE(NULLIF(TRIM(u.empresa), ''), u.nombre) AS desarrollador_nombre,
    a.nombre,
    a.descripcion,
    a.version,
    a.precio_eur,
    a.tipo_activo,
    a.categoria,
    a.imagen_url,
    a.rating_promedio,
    a.num_valoraciones,
    a.estado_auditoria,
    a.hash_integridad,
    a.firma_digital,
    a.guia_despliegue,
    a.admite_adaptacion,
    a.created_at::text AS created_at,
    au.resultado_global AS audit_resultado,
    au.logs_sandbox AS audit_logs,
    au.vulnerabilidades_detectadas AS audit_vulnerabilidades,
    au.permisos_aprobados AS audit_permisos,
    au.fecha_ejecucion::text AS audit_fecha
  FROM agentes a
  JOIN usuarios u ON u.id = a.desarrollador_id
  JOIN LATERAL (
    SELECT
      resultado_global,
      logs_sandbox,
      vulnerabilidades_detectadas,
      permisos_aprobados,
      fecha_ejecucion
    FROM auditorias
    WHERE agente_id = a.id
    ORDER BY fecha_ejecucion DESC
    LIMIT 1
  ) au ON true
  WHERE a.estado_auditoria = 'certificado'
  ORDER BY a.created_at DESC, a.nombre ASC
  LIMIT 100
`;

const LEGACY_CATALOG_QUERY = `
  SELECT
    a.id::text AS id,
    a.desarrollador_id::text AS desarrollador_id,
    COALESCE(NULLIF(TRIM(u.empresa), ''), u.nombre) AS desarrollador_nombre,
    a.nombre,
    a.descripcion,
    a.version,
    a.precio_eur,
    a.tipo_activo,
    a.estado_auditoria,
    a.hash_integridad,
    a.firma_digital,
    a.created_at::text AS created_at,
    au.resultado_global AS audit_resultado,
    au.logs_sandbox AS audit_logs,
    au.vulnerabilidades_detectadas AS audit_vulnerabilidades,
    au.permisos_aprobados AS audit_permisos,
    au.fecha_ejecucion::text AS audit_fecha
  FROM agentes a
  JOIN usuarios u ON u.id = a.desarrollador_id
  JOIN LATERAL (
    SELECT
      resultado_global,
      logs_sandbox,
      vulnerabilidades_detectadas,
      permisos_aprobados,
      fecha_ejecucion
    FROM auditorias
    WHERE agente_id = a.id
    ORDER BY fecha_ejecucion DESC
    LIMIT 1
  ) au ON true
  WHERE a.estado_auditoria = 'certificado'
  ORDER BY a.created_at DESC, a.nombre ASC
  LIMIT 100
`;

function parsePrecio(value: string | number): number {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRating(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapRowToAgente(row: AgenteRowRaw): Agente {
  return {
    id: row.id,
    desarrollador_id: row.desarrollador_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    version: row.version,
    precio_eur: parsePrecio(row.precio_eur),
    tipo_activo: row.tipo_activo,
    categoria: row.categoria ?? "automatizacion",
    imagen_url: row.imagen_url ?? null,
    rating_promedio: parseRating(row.rating_promedio),
    num_valoraciones: row.num_valoraciones ?? 0,
    estado_auditoria: row.estado_auditoria,
    hash_integridad: row.hash_integridad,
    firma_digital: row.firma_digital,
    guia_despliegue: row.guia_despliegue ?? null,
    admite_adaptacion: row.admite_adaptacion ?? false,
    created_at: row.created_at,
  };
}

function rowsToAgentes(rows: AgenteRowRaw[]): AgenteConAuditoria[] {
  const agentes: AgenteConAuditoria[] = [];
  for (const row of rows) {
    const agente = mapRowToAgente(row);
    const { auditoria, hash_integridad } = resolveCatalogAuditoriaFromDatabase(
      agente,
      row,
    );
    if (!auditoria) continue;
    agentes.push({
      ...agente,
      hash_integridad,
      auditoria,
      desarrollador_nombre: row.desarrollador_nombre ?? undefined,
    });
  }
  return agentes;
}

export async function getCatalogoAgentes(): Promise<AgenteConAuditoria[]> {
  try {
    const rows = await query<AgenteRowRaw>(CATALOG_QUERY);
    return rowsToAgentes(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const missingMarketplaceColumns =
      message.includes("categoria") ||
      message.includes("imagen_url") ||
      message.includes("rating_promedio") ||
      message.includes("num_valoraciones") ||
      message.includes("guia_despliegue") ||
      message.includes("admite_adaptacion");

    if (missingMarketplaceColumns) {
      try {
        const legacyRows = await query<AgenteRowRaw>(LEGACY_CATALOG_QUERY);
        return rowsToAgentes(
          legacyRows.map((row) => ({
            ...row,
            categoria: null,
            imagen_url: null,
            rating_promedio: null,
            num_valoraciones: null,
            guia_despliegue: null,
            admite_adaptacion: false,
          })),
        );
      } catch (legacyError) {
        console.error("[catalogo] Fallback legacy falló.", legacyError);
      }
    }

    console.error(
      "[catalogo] No se pudieron cargar agentes desde Neon.",
      error,
    );
    return [];
  }
}
