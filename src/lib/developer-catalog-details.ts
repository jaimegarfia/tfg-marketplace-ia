import { query } from "@/lib/db";

const MIN_GUIA_LENGTH = 40;

export interface SaveCatalogDetailsInput {
  developerId: string;
  agenteId: string;
  guiaDespliegue: string;
  admiteAdaptacion: boolean;
}

export function validateCatalogDetailsInput(
  input: Omit<SaveCatalogDetailsInput, "developerId" | "agenteId">,
): { ok: true } | { ok: false; error: string } {
  const guia = input.guiaDespliegue.trim();
  if (guia.length < MIN_GUIA_LENGTH) {
    return {
      ok: false,
      error: `La guía de despliegue debe tener al menos ${MIN_GUIA_LENGTH} caracteres.`,
    };
  }
  return { ok: true };
}

export async function saveDeveloperCatalogDetails(
  input: SaveCatalogDetailsInput,
): Promise<boolean> {
  const validation = validateCatalogDetailsInput(input);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  try {
    const rows = await query<{ id: string }>(
      `
        UPDATE agentes
        SET
          guia_despliegue = $3,
          admite_adaptacion = $4
        WHERE id = $1::uuid
          AND desarrollador_id = $2::uuid
          AND estado_auditoria = 'certificado'
        RETURNING id::text AS id
      `,
      [
        input.agenteId,
        input.developerId,
        input.guiaDespliegue.trim(),
        input.admiteAdaptacion,
      ],
    );
    return rows.length > 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      !message.includes("guia_despliegue") &&
      !message.includes("admite_adaptacion")
    ) {
      throw error;
    }
    throw new Error(
      "Faltan columnas en la base de datos. Ejecuta scripts/migration-guia-adaptacion.sql en Neon.",
    );
  }
}

export async function agenteHasGuiaDespliegue(agenteId: string): Promise<boolean> {
  try {
    const rows = await query<{ has_guia: boolean }>(
      `
        SELECT (guia_despliegue IS NOT NULL AND LENGTH(TRIM(guia_despliegue)) > 0) AS has_guia
        FROM agentes
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [agenteId],
    );
    return Boolean(rows[0]?.has_guia);
  } catch {
    return false;
  }
}
