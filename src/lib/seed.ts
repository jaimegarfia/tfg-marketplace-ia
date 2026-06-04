import type { PoolClient } from "@neondatabase/serverless";
import { withTransaction } from "@/lib/db";
import {
  DEFAULT_AUDIT_LOGS,
  SEED_AGENTS,
  SEED_DEVELOPERS,
  type SeedAgentInput,
} from "@/lib/seed-catalog";

export interface PurgeSummary {
  servicios_fine_tuning: number;
  transacciones: number;
  auditorias: number;
  agentes: number;
}

export interface SeedSummary {
  purged: PurgeSummary;
  developers: number;
  inserted: number;
  audits: number;
  certificados: number;
  gratis: number;
}

async function purgeCatalogData(client: PoolClient): Promise<PurgeSummary> {
  const ft = await client.query("DELETE FROM servicios_fine_tuning");
  const tx = await client.query("DELETE FROM transacciones");
  const au = await client.query("DELETE FROM auditorias");
  const ag = await client.query("DELETE FROM agentes");

  return {
    servicios_fine_tuning: ft.rowCount ?? 0,
    transacciones: tx.rowCount ?? 0,
    auditorias: au.rowCount ?? 0,
    agentes: ag.rowCount ?? 0,
  };
}

async function upsertDeveloper(
  client: PoolClient,
  email: string,
  nombre: string,
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id::text AS id
      FROM usuarios
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  if (existing.rows[0]?.id) {
    await client.query(
      `
        UPDATE usuarios
        SET nombre = $2, rol = 'desarrollador'
        WHERE id = $1::uuid
      `,
      [existing.rows[0].id, nombre],
    );
    return existing.rows[0].id;
  }

  const created = await client.query<{ id: string }>(
    `
      INSERT INTO usuarios (email, nombre, rol, avatar_url)
      VALUES ($1, $2, 'desarrollador', NULL)
      RETURNING id::text AS id
    `,
    [email, nombre],
  );

  const id = created.rows[0]?.id;
  if (!id) {
    throw new Error(`No se pudo crear el desarrollador ${email}.`);
  }
  return id;
}

async function insertAgentLegacy(
  client: PoolClient,
  developerId: string,
  agent: SeedAgentInput,
): Promise<string> {
  const inserted = await client.query<{ id: string }>(
    `
      INSERT INTO agentes (
        desarrollador_id,
        nombre,
        descripcion,
        version,
        precio_eur,
        tipo_activo,
        estado_auditoria,
        hash_integridad,
        firma_digital
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id::text AS id
    `,
    [
      developerId,
      agent.nombre,
      agent.descripcion,
      agent.version,
      agent.precio_eur,
      agent.tipo_activo,
      agent.estado_auditoria,
      agent.hash_integridad,
      agent.firma_digital,
    ],
  );

  const id = inserted.rows[0]?.id;
  if (!id) throw new Error(`No se pudo insertar ${agent.nombre}.`);
  return id;
}

async function insertAgent(
  client: PoolClient,
  developerId: string,
  agent: SeedAgentInput,
): Promise<string> {
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
          firma_digital
        )
        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id::text AS id
      `,
      [
        developerId,
        agent.nombre,
        agent.descripcion,
        agent.version,
        agent.precio_eur,
        agent.tipo_activo,
        agent.categoria,
        agent.imagen_url,
        agent.rating_promedio,
        agent.num_valoraciones,
        agent.estado_auditoria,
        agent.hash_integridad,
        agent.firma_digital,
      ],
    );
    const id = inserted.rows[0]?.id;
    if (!id) throw new Error(`No se pudo insertar ${agent.nombre}.`);
    return id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("categoria") ||
      message.includes("rating_promedio") ||
      message.includes("num_valoraciones")
    ) {
      return insertAgentLegacy(client, developerId, agent);
    }
    throw error;
  }
}

async function insertAuditForCertifiedAgent(
  client: PoolClient,
  agenteId: string,
  agent: SeedAgentInput,
): Promise<boolean> {
  if (agent.estado_auditoria !== "certificado" || !agent.hash_integridad) {
    return false;
  }

  const logs = agent.audit_logs ?? DEFAULT_AUDIT_LOGS;
  const permisosJson = JSON.stringify(agent.permisos_aprobados);

  const attempts: Array<{ sql: string; values: unknown[] }> = [
    {
      sql: `
        INSERT INTO auditorias (
          agente_id, resultado_global, logs_sandbox,
          vulnerabilidades_detectadas, permisos_aprobados, fecha_ejecucion
        ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      `,
      values: [agenteId, true, logs, 0, permisosJson],
    },
    {
      sql: `
        INSERT INTO auditorias (
          agente_id, resultado_global, logs_sandbox,
          vulnerabilidades_detectadas, permisos_aprobados, fecha_ejecucion
        ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
      `,
      values: [agenteId, true, logs, JSON.stringify(0), permisosJson],
    },
  ];

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index]!;
    const savepoint = `sp_seed_audit_${index}`;
    try {
      await client.query(`SAVEPOINT ${savepoint}`);
      await client.query(attempt.sql, attempt.values as unknown[]);
      await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return true;
    } catch {
      await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    }
  }

  return false;
}

export async function seedCatalogData(): Promise<SeedSummary> {
  return withTransaction(async (client) => {
    const purged = await purgeCatalogData(client);

    const developerIds = new Map<string, string>();
    for (const dev of SEED_DEVELOPERS) {
      developerIds.set(
        dev.email,
        await upsertDeveloper(client, dev.email, dev.nombre),
      );
    }

    let inserted = 0;
    let audits = 0;
    let certificados = 0;
    let gratis = 0;

    for (const agent of SEED_AGENTS) {
      const developerId = developerIds.get(agent.developer_email);
      if (!developerId) {
        throw new Error(`Desarrollador no registrado: ${agent.developer_email}`);
      }

      const agenteId = await insertAgent(client, developerId, agent);
      inserted += 1;

      if (agent.estado_auditoria === "certificado") certificados += 1;
      if (agent.precio_eur === 0) gratis += 1;

      const auditCreated = await insertAuditForCertifiedAgent(
        client,
        agenteId,
        agent,
      );
      if (auditCreated) audits += 1;
    }

    return {
      purged,
      developers: developerIds.size,
      inserted,
      audits,
      certificados,
      gratis,
    };
  });
}
