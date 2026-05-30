import type { PoolClient } from "@neondatabase/serverless";
import { withTransaction } from "@/lib/db";
import type { EstadoAuditoria, TipoActivo } from "@/types/database";

interface SeedAgentInput {
  nombre: string;
  descripcion: string;
  version: string;
  precio_usd: number;
  tipo_activo: TipoActivo;
  estado_auditoria: EstadoAuditoria;
  hash_integridad: string | null;
  firma_digital: string | null;
}

interface SeedSummary {
  developer_id: string;
  inserted: number;
  updated: number;
}

const DEVELOPER = {
  email: "dev.catalogo@certia.local",
  nombre: "Certia Labs",
  rol: "desarrollador" as const,
  avatar_url: null,
};

const AGENTES_PREMIUM: readonly SeedAgentInput[] = [
  {
    nombre: "Sentinel RAG",
    descripcion:
      "Agente de recuperación aumentada con aislamiento de contexto y trazabilidad de fuentes para entornos regulados.",
    version: "2.4.1",
    precio_usd: 149,
    tipo_activo: "runtime_artifact",
    estado_auditoria: "certificado",
    hash_integridad:
      "9f2c1b7e4a6d8c0f3e5a7b9d1c2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8",
    firma_digital: "sig_ed25519_sentinel_2_4_1",
  },
  {
    nombre: "FlowOps Orchestrator",
    descripcion:
      "Arquitectura de referencia para orquestar agentes multi-paso con cuotas, presupuestos y políticas de fallback.",
    version: "1.0.0",
    precio_usd: 0,
    tipo_activo: "reference_architecture",
    estado_auditoria: "en_auditoria",
    hash_integridad: null,
    firma_digital: null,
  },
  {
    nombre: "Ledger Guardian",
    descripcion:
      "Agente de conciliación financiera con verificación criptográfica de salidas y registro inmutable de decisiones.",
    version: "3.1.7",
    precio_usd: 299,
    tipo_activo: "runtime_artifact",
    estado_auditoria: "certificado",
    hash_integridad:
      "1a3c5e7f9b0d2f4a6c8e0a2c4e6f8b0d2f4a6c8e0a2c4e6f8b0d2f4a6c8e0a2",
    firma_digital: "sig_ed25519_ledger_3_1_7",
  },
] as const;

async function upsertDeveloper(client: PoolClient): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id::text AS id
      FROM usuarios
      WHERE email = $1
      LIMIT 1
    `,
    [DEVELOPER.email],
  );

  if (existing.rows[0]?.id) {
    await client.query(
      `
        UPDATE usuarios
        SET nombre = $2,
            rol = $3,
            avatar_url = $4
        WHERE id = $1::uuid
      `,
      [existing.rows[0].id, DEVELOPER.nombre, DEVELOPER.rol, DEVELOPER.avatar_url],
    );
    return existing.rows[0].id;
  }

  const created = await client.query<{ id: string }>(
    `
      INSERT INTO usuarios (email, nombre, rol, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id::text AS id
    `,
    [DEVELOPER.email, DEVELOPER.nombre, DEVELOPER.rol, DEVELOPER.avatar_url],
  );

  const developerId = created.rows[0]?.id;
  if (!developerId) {
    throw new Error("No se pudo crear el usuario desarrollador de seed.");
  }

  return developerId;
}

async function upsertAgent(
  client: PoolClient,
  developerId: string,
  agent: SeedAgentInput,
): Promise<"inserted" | "updated"> {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id::text AS id
      FROM agentes
      WHERE desarrollador_id = $1::uuid
        AND nombre = $2
      LIMIT 1
    `,
    [developerId, agent.nombre],
  );

  if (existing.rows[0]?.id) {
    await client.query(
      `
        UPDATE agentes
        SET descripcion = $2,
            version = $3,
            precio_usd = $4,
            tipo_activo = $5,
            estado_auditoria = $6,
            hash_integridad = $7,
            firma_digital = $8
        WHERE id = $1::uuid
      `,
      [
        existing.rows[0].id,
        agent.descripcion,
        agent.version,
        agent.precio_usd,
        agent.tipo_activo,
        agent.estado_auditoria,
        agent.hash_integridad,
        agent.firma_digital,
      ],
    );
    return "updated";
  }

  await client.query(
    `
      INSERT INTO agentes (
        desarrollador_id,
        nombre,
        descripcion,
        version,
        precio_usd,
        tipo_activo,
        estado_auditoria,
        hash_integridad,
        firma_digital
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      developerId,
      agent.nombre,
      agent.descripcion,
      agent.version,
      agent.precio_usd,
      agent.tipo_activo,
      agent.estado_auditoria,
      agent.hash_integridad,
      agent.firma_digital,
    ],
  );

  return "inserted";
}

export async function seedCatalogData(): Promise<SeedSummary> {
  return withTransaction(async (client) => {
    const developerId = await upsertDeveloper(client);
    let inserted = 0;
    let updated = 0;

    for (const agent of AGENTES_PREMIUM) {
      const result = await upsertAgent(client, developerId, agent);
      if (result === "inserted") inserted += 1;
      if (result === "updated") updated += 1;
    }

    return {
      developer_id: developerId,
      inserted,
      updated,
    };
  });
}
