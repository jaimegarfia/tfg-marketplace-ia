import { query } from "@/lib/db";
import type {
  EstadoAuditoria,
  EstadoProcesoFineTuning,
  TipoActivo,
} from "@/types/database";

export interface DeveloperProfile {
  id: string;
  email: string;
  nombre: string;
}

export interface DeveloperMetrics {
  ingresosTotalesEur: number;
  unidadesDistribuidas: number;
  tasaAceptacionSandbox: number;
  totalAgentes: number;
  agentesCertificados: number;
}

export interface DeveloperAgenteRow {
  id: string;
  nombre: string;
  version: string;
  tipo_activo: TipoActivo;
  precio_eur: number;
  estado_auditoria: EstadoAuditoria;
  logs_sandbox: string | null;
}

export interface FineTuningRequestRow {
  id: string;
  agente_id: string;
  agente_nombre: string;
  contexto_privado_desc: string;
  estado_proceso: EstadoProcesoFineTuning;
  updated_at: string;
}

export interface DeveloperDashboardData {
  developer: DeveloperProfile;
  metrics: DeveloperMetrics;
  agentes: DeveloperAgenteRow[];
  fineTuningRequests: FineTuningRequestRow[];
}

interface DeveloperRow {
  id: string;
  email: string;
  nombre: string;
}

interface MetricsRow {
  ingresos_totales: string | number | null;
  unidades_distribuidas: string | number | null;
  agentes_certificados: string | number | null;
  total_agentes: string | number | null;
}

interface AgenteDashboardRow {
  id: string;
  nombre: string;
  version: string;
  tipo_activo: TipoActivo;
  precio_eur: string | number;
  estado_auditoria: EstadoAuditoria;
  logs_sandbox: string | null;
}

interface FineTuningRow {
  id: string;
  agente_id: string;
  agente_nombre: string;
  contexto_privado_desc: string;
  estado_proceso: EstadoProcesoFineTuning;
  updated_at: string;
}

function parseNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCount(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function resolveDeveloperById(
  developerId: string,
): Promise<DeveloperProfile | null> {
  const rows = await query<DeveloperRow>(
    `
      SELECT id::text AS id, email, nombre
      FROM usuarios
      WHERE id = $1::uuid AND rol = 'desarrollador'
      LIMIT 1
    `,
    [developerId],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
  };
}

export async function resolveDeveloperByEmail(
  email: string,
): Promise<DeveloperProfile | null> {
  const rows = await query<DeveloperRow>(
    `
      SELECT id::text AS id, email, nombre
      FROM usuarios
      WHERE LOWER(email) = LOWER($1) AND rol = 'desarrollador'
      LIMIT 1
    `,
    [email.trim()],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
  };
}

async function getDeveloperMetrics(
  developerId: string,
): Promise<DeveloperMetrics> {
  const rows = await query<MetricsRow>(
    `
      SELECT
        COALESCE((
          SELECT SUM(a.precio_eur::numeric)
          FROM transacciones t
          INNER JOIN agentes a ON a.id = t.agente_id
          WHERE a.desarrollador_id = $1::uuid
            AND t.estado_pago = 'completado'
        ), 0)::double precision AS ingresos_totales,
        COALESCE((
          SELECT COUNT(*)::int
          FROM transacciones t
          INNER JOIN agentes a ON a.id = t.agente_id
          WHERE a.desarrollador_id = $1::uuid
            AND t.estado_pago = 'completado'
        ), 0)::int AS unidades_distribuidas,
        COALESCE((
          SELECT COUNT(*)::int
          FROM agentes
          WHERE desarrollador_id = $1::uuid
            AND estado_auditoria = 'certificado'
        ), 0) AS agentes_certificados,
        COALESCE((
          SELECT COUNT(*)::int
          FROM agentes
          WHERE desarrollador_id = $1::uuid
        ), 0) AS total_agentes
    `,
    [developerId],
  );

  const row = rows[0];
  const totalAgentes = parseCount(row?.total_agentes);
  const agentesCertificados = parseCount(row?.agentes_certificados);
  const tasaAceptacionSandbox =
    totalAgentes > 0
      ? Math.round((agentesCertificados / totalAgentes) * 1000) / 10
      : 0;

  return {
    ingresosTotalesEur: parseNumber(row?.ingresos_totales),
    unidadesDistribuidas: parseCount(row?.unidades_distribuidas),
    tasaAceptacionSandbox,
    totalAgentes,
    agentesCertificados,
  };
}

async function getDeveloperAgentes(
  developerId: string,
): Promise<DeveloperAgenteRow[]> {
  const rows = await query<AgenteDashboardRow>(
    `
      SELECT
        a.id::text AS id,
        a.nombre,
        a.version,
        a.tipo_activo,
        a.precio_eur,
        a.estado_auditoria,
        au.logs_sandbox
      FROM agentes a
      LEFT JOIN LATERAL (
        SELECT logs_sandbox
        FROM auditorias
        WHERE agente_id = a.id
        ORDER BY fecha_ejecucion DESC
        LIMIT 1
      ) au ON true
      WHERE a.desarrollador_id = $1::uuid
      ORDER BY a.created_at DESC, a.nombre ASC
    `,
    [developerId],
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    version: row.version,
    tipo_activo: row.tipo_activo,
    precio_eur: parseNumber(row.precio_eur),
    estado_auditoria: row.estado_auditoria,
    logs_sandbox: row.logs_sandbox,
  }));
}

async function getFineTuningRequests(
  developerId: string,
): Promise<FineTuningRequestRow[]> {
  try {
    const rows = await query<FineTuningRow>(
      `
        SELECT
          sf.id::text AS id,
          a.id::text AS agente_id,
          a.nombre AS agente_nombre,
          sf.contexto_privado_desc,
          sf.estado_proceso,
          sf.updated_at::text AS updated_at
        FROM servicios_fine_tuning sf
        INNER JOIN transacciones t ON t.id = sf.transaccion_id
        INNER JOIN agentes a ON a.id = t.agente_id
        WHERE a.desarrollador_id = $1::uuid
        ORDER BY sf.updated_at DESC
      `,
      [developerId],
    );

    return rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("servicios_fine_tuning")) {
      return [];
    }
    throw error;
  }
}

export async function getDeveloperDashboardData(
  developerId: string,
): Promise<Omit<DeveloperDashboardData, "developer"> & { developerId: string }> {
  const [metrics, agentes, fineTuningRequests] = await Promise.all([
    getDeveloperMetrics(developerId),
    getDeveloperAgentes(developerId),
    getFineTuningRequests(developerId),
  ]);

  return {
    developerId,
    metrics,
    agentes,
    fineTuningRequests,
  };
}

export async function updateFineTuningEstadoForDeveloper(
  servicioId: string,
  estado: EstadoProcesoFineTuning,
  developerId: string,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `
      UPDATE servicios_fine_tuning sf
      SET estado_proceso = $2, updated_at = NOW()
      FROM transacciones t
      INNER JOIN agentes a ON a.id = t.agente_id
      WHERE sf.id = $1::uuid
        AND sf.transaccion_id = t.id
        AND a.desarrollador_id = $3::uuid
      RETURNING sf.id::text AS id
    `,
    [servicioId, estado, developerId],
  );

  return rows.length > 0;
}
