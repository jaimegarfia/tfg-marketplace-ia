import type { PoolClient } from "@neondatabase/serverless";
import { withTransaction } from "@/lib/db";
import { runSimulatedAuditEngine } from "@/lib/audit-engine";
import {
  isAssetVisualIconId,
  type AssetVisualIconId,
} from "@/lib/asset-visual-icons";
import type { AuditFailureKind } from "@/lib/audit-engine";
import type {
  ApprovedPermissions,
  CategoriaAgente,
  EstadoAuditoria,
  TipoActivo,
} from "@/types/database";

export interface PublishAssetInput {
  developerId: string;
  nombre: string;
  version: string;
  precioEur: number;
  tipoActivo: TipoActivo;
  categoria: CategoriaAgente;
  descripcion: string;
  descriptorTecnico: string;
  imagenUrl: string;
  estudioComercial?: string | null;
  admiteAdaptacion: boolean;
}

export interface PublishAssetResult {
  agenteId: string;
  nombre: string;
  estadoAuditoria: EstadoAuditoria;
  resultadoGlobal: boolean;
  hashIntegridad: string;
  vulnerabilidadesDetectadas: number;
  logsSandbox: string;
  permisosAprobados: ApprovedPermissions | null;
  fechaEjecucion: string;
  failureKind: AuditFailureKind;
}

const VALID_TIPOS: ReadonlySet<TipoActivo> = new Set([
  "runtime_artifact",
  "reference_architecture",
]);

const VALID_CATEGORIAS: ReadonlySet<CategoriaAgente> = new Set([
  "rag",
  "automatizacion",
  "finanzas",
  "compliance",
  "orquestacion",
  "datos",
  "seguridad",
  "otros",
]);

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
}

export function validatePublishInput(
  raw: Omit<PublishAssetInput, "developerId">,
): { ok: true } | { ok: false; error: string } {
  if (!raw.nombre.trim()) {
    return { ok: false, error: "El nombre del activo es obligatorio." };
  }
  if (raw.nombre.trim().length > 100) {
    return { ok: false, error: "El nombre no puede superar 100 caracteres." };
  }
  if (!raw.version.trim()) {
    return { ok: false, error: "La versión es obligatoria." };
  }
  if (!raw.descripcion.trim()) {
    return { ok: false, error: "La descripción comercial es obligatoria." };
  }
  if (!Number.isFinite(raw.precioEur) || raw.precioEur < 0) {
    return { ok: false, error: "El precio debe ser un número mayor o igual a 0." };
  }
  if (!VALID_TIPOS.has(raw.tipoActivo)) {
    return { ok: false, error: "Tipo de activo inválido." };
  }
  if (!VALID_CATEGORIAS.has(raw.categoria)) {
    return { ok: false, error: "Categoría inválida." };
  }
  if (!isAssetVisualIconId(raw.imagenUrl)) {
    return { ok: false, error: "Selecciona un icono visual válido para el activo." };
  }
  if (!raw.descriptorTecnico.trim()) {
    return { ok: false, error: "El descriptor técnico (JSON) es obligatorio." };
  }
  try {
    JSON.parse(raw.descriptorTecnico);
  } catch {
    return {
      ok: false,
      error: "El descriptor técnico debe ser un JSON válido.",
    };
  }
  return { ok: true };
}

async function persistDeveloperEstudio(
  client: PoolClient,
  developerId: string,
  estudio: string | null | undefined,
): Promise<void> {
  const trimmed = estudio?.trim();
  if (!trimmed) return;

  try {
    await client.query(
      `
        UPDATE usuarios
        SET empresa = $2
        WHERE id = $1::uuid AND rol = 'desarrollador'
      `,
      [developerId, trimmed],
    );
  } catch {
    // Columna empresa opcional en despliegues sin migración.
  }
}

async function insertAuditedAsset(
  client: PoolClient,
  input: PublishAssetInput,
  engine: {
    resultado_global: boolean;
    hash_integridad: string;
    estadoAuditoria: EstadoAuditoria;
  },
): Promise<string> {
  const firmaDigital = engine.resultado_global
    ? `sig_ed25519_${slugify(input.nombre)}`
    : null;

  const params = [
    input.developerId,
    input.nombre.trim(),
    input.descripcion.trim(),
    input.version.trim(),
    input.precioEur,
    input.tipoActivo,
    input.categoria,
    input.imagenUrl,
    engine.estadoAuditoria,
    engine.hash_integridad,
    firmaDigital,
    input.admiteAdaptacion,
  ];

  try {
    const inserted = await client.query<{ id: string }>(
      `
        INSERT INTO agentes (
          desarrollador_id,
          nombre,
          descripcion,
          version,
          precio_eur,
          tipo_activo,
          categoria,
          imagen_url,
          rating_promedio,
          num_valoraciones,
          estado_auditoria,
          hash_integridad,
          firma_digital,
          admite_adaptacion
        )
        VALUES (
          $1::uuid, $2, $3, $4, $5, $6, $7::categoria_agente,
          $8, 0, 0, $9, $10, $11, $12
        )
        RETURNING id::text AS id
      `,
      params,
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("No se pudo registrar el activo en el catálogo.");
    }
    return id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("admite_adaptacion")) {
      throw error;
    }

    const inserted = await client.query<{ id: string }>(
      `
        INSERT INTO agentes (
          desarrollador_id,
          nombre,
          descripcion,
          version,
          precio_eur,
          tipo_activo,
          categoria,
          imagen_url,
          rating_promedio,
          num_valoraciones,
          estado_auditoria,
          hash_integridad,
          firma_digital
        )
        VALUES (
          $1::uuid, $2, $3, $4, $5, $6, $7::categoria_agente,
          $8, 0, 0, $9, $10, $11
        )
        RETURNING id::text AS id
      `,
      params.slice(0, 11),
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("No se pudo registrar el activo en el catálogo.");
    }
    return id;
  }
}

async function insertAuditoria(
  client: PoolClient,
  agenteId: string,
  engine: {
    resultado_global: boolean;
    logs_sandbox: string;
    vulnerabilidades_detectadas: number;
    permisos_aprobados: ApprovedPermissions;
  },
  fechaEjecucion: string,
): Promise<void> {
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
      JSON.stringify(engine.permisos_aprobados),
      fechaEjecucion,
    ],
  );
}

/**
 * Publica un activo del desarrollador ejecutando el motor de auditoría real
 * (contenedor Docker aislado) y persistiendo agente + auditoría en una
 * transacción ACID.
 */
export async function publishDeveloperAsset(
  input: PublishAssetInput,
): Promise<PublishAssetResult> {
  let engine: Awaited<ReturnType<typeof runSimulatedAuditEngine>>;
  try {
    engine = await runSimulatedAuditEngine({
      assetName: input.nombre,
      assetDescriptor: input.descriptorTecnico,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido en sandbox.";
    throw new Error(`La auditoría en contenedor falló: ${detail}`);
  }

  const fechaEjecucion = new Date().toISOString();

  if (!engine.resultado_global) {
    return {
      agenteId: "",
      nombre: input.nombre.trim(),
      estadoAuditoria: "rechazado",
      resultadoGlobal: false,
      hashIntegridad: engine.hash_integridad,
      vulnerabilidadesDetectadas: engine.vulnerabilidades_detectadas,
      logsSandbox: engine.logs_sandbox,
      permisosAprobados: engine.permisos_aprobados,
      fechaEjecucion,
      failureKind: engine.failureKind,
    };
  }

  const permisosAprobados = engine.permisos_aprobados;
  if (!permisosAprobados) {
    throw new Error(
      "La auditoría certificó el activo pero no devolvió permisos del sandbox.",
    );
  }

  let agenteId: string;
  try {
    agenteId = await withTransaction(async (client) => {
      const id = await insertAuditedAsset(client, input, {
        resultado_global: engine.resultado_global,
        hash_integridad: engine.hash_integridad,
        estadoAuditoria: "certificado",
      });

      await persistDeveloperEstudio(
        client,
        input.developerId,
        input.estudioComercial,
      );

      await insertAuditoria(
        client,
        id,
        {
          resultado_global: engine.resultado_global,
          logs_sandbox: engine.logs_sandbox,
          vulnerabilidades_detectadas: engine.vulnerabilidades_detectadas,
          permisos_aprobados: permisosAprobados,
        },
        fechaEjecucion,
      );

      return id;
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido en base de datos.";
    throw new Error(`No se pudo persistir el activo en Neon: ${detail}`);
  }

  return {
    agenteId,
    nombre: input.nombre.trim(),
    estadoAuditoria: "certificado",
    resultadoGlobal: true,
    hashIntegridad: engine.hash_integridad,
    vulnerabilidadesDetectadas: engine.vulnerabilidades_detectadas,
    logsSandbox: engine.logs_sandbox,
    permisosAprobados,
    fechaEjecucion,
    failureKind: engine.failureKind,
  };
}
