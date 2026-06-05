import { NextResponse } from "next/server";
import type { PoolClient } from "@neondatabase/serverless";
import { runAuditEngine } from "@/lib/audit-engine";
import { withTransaction } from "@/lib/db";
import type { EstadoAuditoria, ResultadoAuditoria, TipoActivo } from "@/types/database";

export const runtime = "nodejs";

interface UploadPayload {
  nombre: string;
  version: string;
  precio_eur: number;
  tipo_activo: TipoActivo;
  descriptor_tecnico: string;
}

interface InsertResult {
  agenteId: string;
  estadoAuditoria: EstadoAuditoria;
  resultadoGlobal: boolean;
  hashIntegridad: string;
  vulnerabilidadesDetectadas: number;
  logsSandbox: string;
  permisosAprobados: unknown;
  fechaEjecucion: string;
}

function parsePayload(payload: unknown): UploadPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Body inválido.");
  }

  const data = payload as Record<string, unknown>;
  const nombre = String(data.nombre ?? "").trim();
  const version = String(data.version ?? "").trim();
  const tipo_activo = data.tipo_activo;
  const descriptor_tecnico = String(data.descriptor_tecnico ?? "").trim();
  const precio = Number(data.precio_eur);

  if (!nombre) throw new Error("El nombre del activo es obligatorio.");
  if (!version) throw new Error("La versión es obligatoria.");
  if (!descriptor_tecnico) {
    throw new Error("El descriptor técnico (JSON) es obligatorio.");
  }
  if (!Number.isFinite(precio) || precio < 0) {
    throw new Error("El precio debe ser un número >= 0.");
  }
  if (
    tipo_activo !== "runtime_artifact" &&
    tipo_activo !== "reference_architecture"
  ) {
    throw new Error("Tipo de activo inválido.");
  }

  // El campo de entrada se define como JSON técnico.
  JSON.parse(descriptor_tecnico);

  return {
    nombre,
    version,
    precio_eur: precio,
    tipo_activo,
    descriptor_tecnico,
  };
}

async function resolveDeveloperId(client: PoolClient): Promise<string> {
  const rows = await client.query<{ desarrollador_id: string }>(
    `
      SELECT desarrollador_id::text
      FROM agentes
      ORDER BY created_at ASC
      LIMIT 1
    `,
  );

  const id = rows.rows[0]?.desarrollador_id;
  if (!id) {
    throw new Error(
      "No hay desarrollador base para asociar el activo. Ejecuta seed primero.",
    );
  }
  return id;
}

function mapEstadoAuditoria(resultado: boolean): EstadoAuditoria {
  return resultado ? "certificado" : "rechazado";
}

function mapResultadoAuditoria(resultado: boolean): ResultadoAuditoria {
  return resultado ? "aprobado" : "rechazado";
}

async function insertAuditoriaCompat(
  client: PoolClient,
  params: {
    agenteId: string;
    resultadoTexto: ResultadoAuditoria;
    resultadoBoolean: boolean;
    logs: string;
    vulnerabilidadesCount: number;
    permisosJson: string;
    fecha: string;
    hash: string;
  },
): Promise<void> {
  const attempts: Array<{
    sql: string;
    values: unknown[];
  }> = [
    {
      sql: `
        INSERT INTO auditorias (
          agente_id,
          resultado_global,
          logs_sandbox,
          vulnerabilidades_detectadas,
          permisos_aprobados,
          hash_integridad,
          fecha_ejecucion
        ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
      `,
      values: [
        params.agenteId,
        params.resultadoBoolean,
        params.logs,
        JSON.stringify(params.vulnerabilidadesCount),
        params.permisosJson,
        params.hash,
        params.fecha,
      ],
    },
    {
      sql: `
        INSERT INTO auditorias (
          agente_id,
          resultado_global,
          logs_sandbox,
          vulnerabilidades_detectadas,
          permisos_aprobados,
          fecha_ejecucion
        ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
      `,
      values: [
        params.agenteId,
        params.resultadoBoolean,
        params.logs,
        JSON.stringify(params.vulnerabilidadesCount),
        params.permisosJson,
        params.fecha,
      ],
    },
    {
      sql: `
        INSERT INTO auditorias (
          agente_id,
          resultado_global,
          logs_sandbox,
          vulnerabilidades_detectadas,
          permisos_aprobados,
          fecha_ejecucion
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      `,
      values: [
        params.agenteId,
        params.resultadoBoolean,
        params.logs,
        params.vulnerabilidadesCount,
        params.permisosJson,
        params.fecha,
      ],
    },
    {
      sql: `
        INSERT INTO auditorias (
          agente_id,
          resultado_global,
          logs_sandbox,
          vulnerabilidades_detectadas,
          permisos_aprobados,
          fecha_ejecucion
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      `,
      values: [
        params.agenteId,
        params.resultadoTexto,
        params.logs,
        params.vulnerabilidadesCount,
        params.permisosJson,
        params.fecha,
      ],
    },
  ];

  let lastError: unknown = null;
  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index]!;
    const savepoint = `sp_insert_auditoria_${index}`;
    try {
      await client.query(`SAVEPOINT ${savepoint}`);
      await client.query(attempt.sql, attempt.values as unknown[]);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return;
    } catch (error) {
      lastError = error;
      try {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      } catch (rollbackError) {
        lastError = rollbackError;
        break;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No se pudo insertar la auditoría.");
}

async function persistAuditedAsset(payload: UploadPayload): Promise<InsertResult> {
  const engine = await runAuditEngine({
    assetName: payload.nombre,
    assetDescriptor: payload.descriptor_tecnico,
    tipoActivo: payload.tipo_activo,
  });

  const estadoAuditoria = mapEstadoAuditoria(engine.resultado_global);
  const resultadoAuditoriaTexto = mapResultadoAuditoria(engine.resultado_global);
  const resultadoAuditoriaBoolean = engine.resultado_global;
  const fechaEjecucion = new Date().toISOString();
  const permisosJson = JSON.stringify(engine.permisos_aprobados);

  return withTransaction(async (client) => {
    const desarrolladorId = await resolveDeveloperId(client);
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
        VALUES ($1, $2, $3, $4, $5, $6, 'automatizacion', NULL, 0, 0, $7, $8, NULL)
        RETURNING id::text AS id
      `,
      [
        desarrolladorId,
        payload.nombre,
        payload.descriptor_tecnico,
        payload.version,
        payload.precio_eur,
        payload.tipo_activo,
        estadoAuditoria,
        engine.hash_integridad,
      ],
    );

    const agenteId = inserted.rows[0]?.id;
    if (!agenteId) {
      throw new Error("No se pudo obtener el id del activo insertado.");
    }

    await insertAuditoriaCompat(client, {
      agenteId,
      resultadoTexto: resultadoAuditoriaTexto,
      resultadoBoolean: resultadoAuditoriaBoolean,
      logs: engine.logs_sandbox,
      vulnerabilidadesCount: engine.vulnerabilidades_detectadas,
      permisosJson,
      fecha: fechaEjecucion,
      hash: engine.hash_integridad,
    });

    return {
      agenteId,
      estadoAuditoria,
      resultadoGlobal: engine.resultado_global,
      hashIntegridad: engine.hash_integridad,
      vulnerabilidadesDetectadas: engine.vulnerabilidades_detectadas,
      logsSandbox: engine.logs_sandbox,
      permisosAprobados: engine.permisos_aprobados,
      fechaEjecucion: fechaEjecucion,
    };
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Test upload deshabilitado en producción." },
      { status: 403 },
    );
  }

  try {
    const payload = parsePayload(await request.json());
    const result = await persistAuditedAsset(payload);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, error: "No se pudo publicar el activo de prueba.", detail },
      { status: 400 },
    );
  }
}
