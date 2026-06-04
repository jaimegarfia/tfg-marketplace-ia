import type { PoolClient } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { withTransaction } from "@/lib/db";
import type { EstadoProcesoFineTuning } from "@/types/database";

export interface FineTuningRequestInput {
  agenteId: string;
  contextoPrivadoDesc: string;
  userEmail: string;
  userName: string;
}

export interface FineTuningRequestResult {
  servicioId: string;
  transaccionId: string;
  transaccionCreated: boolean;
}

async function resolveEmpresaId(
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
    return existing.rows[0].id;
  }

  const created = await client.query<{ id: string }>(
    `
      INSERT INTO usuarios (email, nombre, rol, avatar_url)
      VALUES ($1, $2, 'empresa', NULL)
      RETURNING id::text AS id
    `,
    [email, nombre],
  );

  const id = created.rows[0]?.id;
  if (!id) {
    throw new Error("No se pudo registrar el usuario empresa.");
  }
  return id;
}

async function resolveOrCreateTransaccion(
  client: PoolClient,
  empresaId: string,
  agenteId: string,
): Promise<{ transaccionId: string; created: boolean }> {
  const existing = await client.query<{ id: string }>(
    `
      SELECT id::text AS id
      FROM transacciones
      WHERE empresa_id = $1::uuid
        AND agente_id = $2::uuid
        AND estado_pago = 'completado'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [empresaId, agenteId],
  );

  if (existing.rows[0]?.id) {
    return { transaccionId: existing.rows[0].id, created: false };
  }

  const paymentIntentId = `pi_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const inserted = await client.query<{ id: string }>(
    `
      INSERT INTO transacciones (
        empresa_id,
        agente_id,
        stripe_payment_intent_id,
        estado_pago
      )
      VALUES ($1::uuid, $2::uuid, $3, 'completado')
      RETURNING id::text AS id
    `,
    [empresaId, agenteId, paymentIntentId],
  );

  const transaccionId = inserted.rows[0]?.id;
  if (!transaccionId) {
    throw new Error("No se pudo crear la transacción simulada.");
  }

  return { transaccionId, created: true };
}

async function insertServicioFineTuning(
  client: PoolClient,
  transaccionId: string,
  contextoPrivadoDesc: string,
): Promise<string> {
  const estado: EstadoProcesoFineTuning = "solicitado";

  const inserted = await client.query<{ id: string }>(
    `
      INSERT INTO servicios_fine_tuning (
        transaccion_id,
        contexto_privado_desc,
        estado_proceso
      )
      VALUES ($1::uuid, $2, $3)
      RETURNING id::text AS id
    `,
    [transaccionId, contextoPrivadoDesc, estado],
  );

  const servicioId = inserted.rows[0]?.id;
  if (!servicioId) {
    throw new Error("No se pudo registrar la solicitud de adaptación.");
  }

  return servicioId;
}

async function assertAgenteExists(
  client: PoolClient,
  agenteId: string,
): Promise<void> {
  const rows = await client.query<{ id: string }>(
    `
      SELECT id::text AS id
      FROM agentes
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [agenteId],
  );

  if (!rows.rows[0]?.id) {
    throw new Error("El agente indicado no existe en el catálogo.");
  }
}

export async function createFineTuningRequest(
  input: FineTuningRequestInput,
): Promise<FineTuningRequestResult> {
  const contexto = input.contextoPrivadoDesc.trim();
  if (contexto.length < 20) {
    throw new Error(
      "Describe con más detalle los requisitos de adaptación (mínimo 20 caracteres).",
    );
  }

  return withTransaction(async (client) => {
    await assertAgenteExists(client, input.agenteId);

    const empresaId = await resolveEmpresaId(
      client,
      input.userEmail,
      input.userName,
    );

    const { transaccionId, created } = await resolveOrCreateTransaccion(
      client,
      empresaId,
      input.agenteId,
    );

    const servicioId = await insertServicioFineTuning(
      client,
      transaccionId,
      contexto,
    );

    return {
      servicioId,
      transaccionId,
      transaccionCreated: created,
    };
  });
}
