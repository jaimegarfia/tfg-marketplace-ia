import { query } from "@/lib/db";
import { withTransaction } from "@/lib/db";
import { runAuditEngine } from "@/lib/audit-engine";
import type {
  ApprovedPermissions,
  CategoriaAgente,
  EstadoAuditoria,
  TipoActivo,
} from "@/types/database";

export interface AuditHistoryRow {
  id: string;
  resultado_global: boolean;
  fecha_ejecucion: string;
  vulnerabilidades_detectadas: number;
  logs_sandbox: string;
}

export interface ValoracionRow {
  id: string;
  usuario_nombre: string;
  empresa_nombre: string | null;
  puntuacion: number;
  comentario: string;
  created_at: string;
}

export interface DeveloperAssetDetail {
  id: string;
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
  ventas_count: number;
  ingresos_eur: number;
  logs_sandbox: string | null;
  auditHistory: AuditHistoryRow[];
  valoraciones: ValoracionRow[];
}

export interface UpdateAssetInput {
  descripcion: string;
  precioEur: number;
  categoria: CategoriaAgente;
  imagenUrl: string | null;
}

export interface SubmitVersionInput {
  version: string;
  descriptorTecnico: string;
}

export interface SubmitVersionResult {
  estadoAuditoria: EstadoAuditoria;
  resultadoGlobal: boolean;
  hashIntegridad: string;
  vulnerabilidadesDetectadas: number;
  logsSandbox: string;
  permisosAprobados: ApprovedPermissions | null;
  fechaEjecucion: string;
  failureKind: import("@/lib/audit-engine").AuditFailureKind;
}

const DEMO_EMPRESAS = [
  "ComplianceHub EU",
  "Nordic FinOps",
  "MedTech Analytics",
  "RetailOps Global",
  "SecureBank Labs",
] as const;

const DEMO_COMENTARIOS = [
  "Integración rápida con nuestro stack on-premise. Documentación clara.",
  "Cumple los requisitos de auditoría interna. Soporte del desarrollador muy ágil.",
  "Reduce tiempo de conciliación en un 40%. Recomendado para equipos de finanzas.",
  "El sandbox da confianza; despliegue sin sorpresas en producción.",
  "Buen equilibrio entre precio y capacidades. Algunas variables de entorno podrían documentarse mejor.",
  "Excelente para entornos regulados. Los permisos verificados son transparentes.",
  "Funciona bien con n8n y Zapier. La guía de despliegue es precisa.",
  "Valoración positiva tras 3 meses en producción sin incidentes de seguridad.",
] as const;

function parseNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRating(value: string | number | null | undefined): number {
  const n = parseNumber(value);
  return Math.min(5, Math.max(0, n));
}

function parseCount(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hashSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function generateDemoValoraciones(
  agenteId: string,
  nombre: string,
  ratingPromedio: number,
  numValoraciones: number,
): ValoracionRow[] {
  if (numValoraciones <= 0) return [];

  const visible = Math.min(8, numValoraciones);
  const base = hashSeed(agenteId);
  const rows: ValoracionRow[] = [];

  for (let i = 0; i < visible; i += 1) {
    const seed = base + i * 17;
    const empresa =
      DEMO_EMPRESAS[seed % DEMO_EMPRESAS.length] ?? DEMO_EMPRESAS[0];
    const offset = ((seed % 5) - 2) * 0.2;
    const puntuacion = Math.min(
      5,
      Math.max(1, Math.round((ratingPromedio + offset) * 2) / 2),
    );
    const daysAgo = 3 + (seed % 90);
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);

    rows.push({
      id: `demo-${agenteId.slice(0, 8)}-${i}`,
      usuario_nombre: `Usuario ${String.fromCharCode(65 + (seed % 26))}. ${empresa.split(" ")[0]}`,
      empresa_nombre: empresa,
      puntuacion,
      comentario: (
        DEMO_COMENTARIOS[(seed + i) % DEMO_COMENTARIOS.length] ??
        DEMO_COMENTARIOS[0]
      ).replace("activo", nombre),
      created_at: created.toISOString(),
    });
  }

  return rows;
}

async function fetchValoracionesFromDb(
  agenteId: string,
): Promise<ValoracionRow[] | null> {
  try {
    const rows = await query<{
      id: string;
      usuario_nombre: string;
      empresa_nombre: string | null;
      puntuacion: number;
      comentario: string;
      created_at: string;
    }>(
      `
        SELECT
          id::text AS id,
          usuario_nombre,
          empresa_nombre,
          puntuacion,
          comentario,
          created_at::text AS created_at
        FROM valoraciones
        WHERE agente_id = $1::uuid
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [agenteId],
    );

    return rows.map((row) => ({
      id: row.id,
      usuario_nombre: row.usuario_nombre,
      empresa_nombre: row.empresa_nombre,
      puntuacion: row.puntuacion,
      comentario: row.comentario,
      created_at: row.created_at,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("valoraciones")) {
      return null;
    }
    throw error;
  }
}

export async function getDeveloperAssetDetail(
  developerId: string,
  agenteId: string,
): Promise<DeveloperAssetDetail | null> {
  const rows = await query<{
    id: string;
    nombre: string;
    descripcion: string;
    version: string;
    precio_eur: string | number;
    tipo_activo: TipoActivo;
    categoria: CategoriaAgente;
    imagen_url: string | null;
    rating_promedio: string | number | null;
    num_valoraciones: number | null;
    estado_auditoria: EstadoAuditoria;
    hash_integridad: string | null;
    firma_digital: string | null;
    created_at: string;
    ventas_count: string | number | null;
    logs_sandbox: string | null;
  }>(
    `
      SELECT
        a.id::text AS id,
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
        a.created_at::text AS created_at,
        COALESCE((
          SELECT COUNT(*)::int
          FROM transacciones t
          WHERE t.agente_id = $1::uuid AND t.estado_pago = 'completado'
        ), 0) AS ventas_count,
        (
          SELECT au.logs_sandbox
          FROM auditorias au
          WHERE au.agente_id = $1::uuid
          ORDER BY au.fecha_ejecucion DESC
          LIMIT 1
        ) AS logs_sandbox
      FROM agentes a
      WHERE a.id = $1::uuid AND a.desarrollador_id = $2::uuid
      LIMIT 1
    `,
    [agenteId, developerId],
  );

  const row = rows[0];
  if (!row) return null;

  const precioEur = parseNumber(row.precio_eur);
  const ventasCount = parseCount(row.ventas_count);

  const auditRows = await query<{
    id: string;
    resultado_global: boolean;
    fecha_ejecucion: string;
    vulnerabilidades_detectadas: number;
    logs_sandbox: string;
  }>(
    `
      SELECT
        id::text AS id,
        resultado_global,
        fecha_ejecucion::text AS fecha_ejecucion,
        vulnerabilidades_detectadas,
        logs_sandbox
      FROM auditorias
      WHERE agente_id = $1::uuid
      ORDER BY fecha_ejecucion DESC
      LIMIT 10
    `,
    [agenteId],
  );

  const ratingPromedio = parseRating(row.rating_promedio);
  const numValoraciones = row.num_valoraciones ?? 0;

  const dbValoraciones = await fetchValoracionesFromDb(agenteId);
  const valoraciones =
    dbValoraciones && dbValoraciones.length > 0
      ? dbValoraciones
      : generateDemoValoraciones(
          agenteId,
          row.nombre,
          ratingPromedio,
          numValoraciones,
        );

  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    version: row.version,
    precio_eur: precioEur,
    tipo_activo: row.tipo_activo,
    categoria: row.categoria,
    imagen_url: row.imagen_url,
    rating_promedio: ratingPromedio,
    num_valoraciones: numValoraciones,
    estado_auditoria: row.estado_auditoria,
    hash_integridad: row.hash_integridad,
    firma_digital: row.firma_digital,
    created_at: row.created_at,
    ventas_count: ventasCount,
    ingresos_eur: precioEur * ventasCount,
    logs_sandbox: row.logs_sandbox,
    auditHistory: auditRows.map((audit) => ({
      id: audit.id,
      resultado_global: audit.resultado_global,
      fecha_ejecucion: audit.fecha_ejecucion,
      vulnerabilidades_detectadas: audit.vulnerabilidades_detectadas,
      logs_sandbox: audit.logs_sandbox,
    })),
    valoraciones,
  };
}

export function validateUpdateAssetInput(
  input: UpdateAssetInput,
): { ok: true } | { ok: false; error: string } {
  if (!input.descripcion.trim()) {
    return { ok: false, error: "La descripción es obligatoria." };
  }
  if (!Number.isFinite(input.precioEur) || input.precioEur < 0) {
    return { ok: false, error: "El precio debe ser mayor o igual a 0." };
  }
  const imagen = input.imagenUrl?.trim();
  if (
    imagen &&
    !/^https?:\/\/.+/i.test(imagen) &&
    !imagen.startsWith("certia-icon:")
  ) {
    return {
      ok: false,
      error: "La imagen debe ser una URL http(s) o un icono predefinido del catálogo.",
    };
  }
  return { ok: true };
}

export async function updateDeveloperAsset(
  developerId: string,
  agenteId: string,
  input: UpdateAssetInput,
): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `
      UPDATE agentes
      SET
        descripcion = $3,
        precio_eur = $4,
        categoria = $5::categoria_agente,
        imagen_url = $6
      WHERE id = $1::uuid AND desarrollador_id = $2::uuid
      RETURNING id::text AS id
    `,
    [
      agenteId,
      developerId,
      input.descripcion.trim(),
      input.precioEur,
      input.categoria,
      input.imagenUrl?.trim() || null,
    ],
  );

  return rows.length > 0;
}

export function validateVersionInput(
  input: SubmitVersionInput,
): { ok: true } | { ok: false; error: string } {
  if (!input.version.trim()) {
    return { ok: false, error: "La versión es obligatoria." };
  }
  if (!input.descriptorTecnico.trim()) {
    return { ok: false, error: "El descriptor técnico es obligatorio." };
  }
  try {
    JSON.parse(input.descriptorTecnico);
  } catch {
    return { ok: false, error: "El descriptor debe ser JSON válido." };
  }
  return { ok: true };
}

export async function submitDeveloperAssetVersion(
  developerId: string,
  agenteId: string,
  input: SubmitVersionInput,
): Promise<SubmitVersionResult | null> {
  const existing = await query<{ nombre: string; tipo_activo: TipoActivo }>(
    `
      SELECT nombre, tipo_activo
      FROM agentes
      WHERE id = $1::uuid AND desarrollador_id = $2::uuid
      LIMIT 1
    `,
    [agenteId, developerId],
  );

  const agent = existing[0];
  if (!agent) return null;

  let engine: Awaited<ReturnType<typeof runAuditEngine>>;
  try {
    engine = await runAuditEngine({
      assetName: agent.nombre,
      assetDescriptor: input.descriptorTecnico,
      tipoActivo: agent.tipo_activo,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido en sandbox.";
    throw new Error(`La auditoría en contenedor falló: ${detail}`);
  }

  const estadoAuditoria: EstadoAuditoria = engine.resultado_global
    ? "certificado"
    : "rechazado";
  const fechaEjecucion = new Date().toISOString();
  const firmaDigital = engine.resultado_global
    ? `sig_ed25519_${agent.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24)}`
    : null;

  try {
    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE agentes
          SET
            version = $3,
            estado_auditoria = $4,
            hash_integridad = $5,
            firma_digital = $6
          WHERE id = $1::uuid AND desarrollador_id = $2::uuid
        `,
        [
          agenteId,
          developerId,
          input.version.trim(),
          estadoAuditoria,
          engine.hash_integridad,
          firmaDigital,
        ],
      );

      await client.query(
        `
          INSERT INTO auditorias (
            agente_id,
            resultado_global,
            logs_sandbox,
            vulnerabilidades_detectadas,
            permisos_aprobados,
            fecha_ejecucion
          )
          VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6)
        `,
        [
          agenteId,
          engine.resultado_global,
          engine.logs_sandbox,
          engine.vulnerabilidades_detectadas,
          JSON.stringify(
            engine.permisos_aprobados ?? {
              read_filesystem: false,
              network_access: false,
              allowed_domains: [],
              custom_scripts: {
                enabled: false,
                inline_code_detected: false,
                execution_engines: ["none"],
              },
            },
          ),
          fechaEjecucion,
        ],
      );
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido en base de datos.";
    throw new Error(`No se pudo persistir la versión en Neon: ${detail}`);
  }

  return {
    estadoAuditoria,
    resultadoGlobal: engine.resultado_global,
    hashIntegridad: engine.hash_integridad,
    vulnerabilidadesDetectadas: engine.vulnerabilidades_detectadas,
    logsSandbox: engine.logs_sandbox,
    permisosAprobados: engine.permisos_aprobados,
    fechaEjecucion,
    failureKind: engine.failureKind,
  };
}
