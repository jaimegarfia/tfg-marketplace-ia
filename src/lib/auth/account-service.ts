import type { PoolClient } from "@neondatabase/serverless";
import { query, withTransaction } from "@/lib/db";
import type { RolUsuario } from "@/types/database";

export interface UserProfileRecord {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  empresa: string | null;
}

interface UserProfileRow {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  empresa: string | null;
}

let empresaColumnAvailable: boolean | null = null;

async function detectEmpresaColumn(): Promise<boolean> {
  if (empresaColumnAvailable !== null) {
    return empresaColumnAvailable;
  }

  try {
    const rows = await query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'usuarios'
            AND column_name = 'empresa'
        ) AS exists
      `,
    );
    empresaColumnAvailable = Boolean(rows[0]?.exists);
  } catch {
    empresaColumnAvailable = false;
  }

  return empresaColumnAvailable;
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfileRecord | null> {
  const hasEmpresa = await detectEmpresaColumn();
  const empresaSelect = hasEmpresa ? "empresa" : "NULL::text AS empresa";

  const rows = await query<UserProfileRow>(
    `
      SELECT id::text AS id, email, nombre, rol, ${empresaSelect}
      FROM usuarios
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol,
    empresa: row.empresa,
  };
}

export async function updateUserProfile(
  userId: string,
  input: { nombre: string; empresa?: string | null },
): Promise<UserProfileRecord> {
  const nombre = input.nombre.trim();
  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }

  const hasEmpresa = await detectEmpresaColumn();
  const empresa = input.empresa?.trim() || null;

  if (hasEmpresa) {
    const rows = await query<UserProfileRow>(
      `
        UPDATE usuarios
        SET nombre = $2, empresa = $3
        WHERE id = $1::uuid
        RETURNING id::text AS id, email, nombre, rol, empresa
      `,
      [userId, nombre, empresa],
    );
    const row = rows[0];
    if (!row) throw new Error("No se pudo actualizar el perfil.");
    return row;
  }

  const rows = await query<UserProfileRow>(
    `
      UPDATE usuarios
      SET nombre = $2
      WHERE id = $1::uuid
      RETURNING id::text AS id, email, nombre, rol, NULL::text AS empresa
    `,
    [userId, nombre],
  );
  const row = rows[0];
  if (!row) throw new Error("No se pudo actualizar el perfil.");
  return { ...row, empresa: null };
}

async function deleteUserData(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    `
      DELETE FROM servicios_fine_tuning
      WHERE transaccion_id IN (
        SELECT t.id FROM transacciones t
        WHERE t.empresa_id = $1::uuid
           OR t.agente_id IN (
             SELECT id FROM agentes WHERE desarrollador_id = $1::uuid
           )
      )
    `,
    [userId],
  );

  try {
    await client.query(
      `
        DELETE FROM valoraciones
        WHERE agente_id IN (
          SELECT id FROM agentes WHERE desarrollador_id = $1::uuid
        )
      `,
      [userId],
    );
  } catch {
    /* tabla opcional */
  }

  await client.query(
    `
      DELETE FROM auditorias
      WHERE agente_id IN (
        SELECT id FROM agentes WHERE desarrollador_id = $1::uuid
      )
    `,
    [userId],
  );

  await client.query(
    `
      DELETE FROM transacciones
      WHERE empresa_id = $1::uuid
         OR agente_id IN (
           SELECT id FROM agentes WHERE desarrollador_id = $1::uuid
         )
    `,
    [userId],
  );

  await client.query(`DELETE FROM agentes WHERE desarrollador_id = $1::uuid`, [
    userId,
  ]);

  const deleted = await client.query(
    `DELETE FROM usuarios WHERE id = $1::uuid RETURNING id::text AS id`,
    [userId],
  );

  if ((deleted.rowCount ?? 0) === 0) {
    throw new Error("No se encontró la cuenta a eliminar.");
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  await withTransaction(async (client) => {
    await deleteUserData(client, userId);
  });
}
