/**
 * Capa de acceso a datos sobre Neon PostgreSQL usando el driver nativo
 * `@neondatabase/serverless`.
 *
 * Diseño:
 *  - `Pool` (sobre WebSockets) habilita transacciones ACID multi-sentencia
 *    (`BEGIN/COMMIT/ROLLBACK`), necesarias para operaciones críticas como el
 *    registro de transacciones de pago.
 *  - Se reutiliza una ÚNICA instancia (singleton) cacheándola en `globalThis`.
 *    En desarrollo, el Hot Module Replacement de Next.js reevalúa los módulos
 *    en cada cambio; sin el singleton se crearían pools nuevos en cada recarga,
 *    agotando las conexiones del servidor ("connection leak").
 *  - La `DATABASE_URL` se valida al arranque: fallar rápido es preferible a
 *    errores opacos en tiempo de consulta (principio fail-fast).
 */
import { Pool, neonConfig } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "[db] Falta la variable de entorno DATABASE_URL. " +
      "Crea .env.local según docs/env-setup.md y define DATABASE_URL (Neon).",
  );
}

// Pipelining reduce la latencia de round-trips en entornos serverless.
neonConfig.pipelineConnect = "password";

/**
 * Caché tipada en el ámbito global para sobrevivir al HMR de Next.js sin
 * recurrir a `any`.
 */
const globalForDb = globalThis as unknown as {
  __neonPool?: Pool;
};

function createPool(): Pool {
  return new Pool({ connectionString });
}

export const pool: Pool = globalForDb.__neonPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__neonPool = pool;
}

/**
 * Ejecuta una consulta parametrizada y devuelve las filas tipadas.
 * Usa SIEMPRE `params` (consultas parametrizadas) para prevenir inyección SQL.
 *
 * @example
 * const usuarios = await query<Usuario>(
 *   "SELECT * FROM usuario WHERE email = $1",
 *   [email],
 * );
 */
export async function query<T>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const result = await pool.query(text, params as unknown[]);
  return result.rows as T[];
}

/**
 * Ejecuta un conjunto de operaciones dentro de una transacción ACID.
 * Realiza COMMIT si el callback termina sin errores y ROLLBACK en caso
 * contrario, liberando siempre la conexión al pool.
 */
export async function withTransaction<T>(
  fn: (client: import("@neondatabase/serverless").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
