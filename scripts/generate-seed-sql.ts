/**
 * Genera scripts/seed-demo-catalog.sql desde src/lib/seed-catalog.ts
 * Ejecutar: npx tsx scripts/generate-seed-sql.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_AUDIT_LOGS,
  SEED_AGENTS,
  SEED_DEVELOPERS,
} from "../src/lib/seed-catalog";

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableString(value: string | null): string {
  return value === null ? "NULL" : sqlString(value);
}

const developerInserts = SEED_DEVELOPERS.map(
  (d) =>
    `  (${sqlString(d.email)}, ${sqlString(d.nombre)}, 'desarrollador', NULL)`,
).join(",\n");

const agentValues = SEED_AGENTS.map((a) => {
  return `  (
    (SELECT id FROM usuarios WHERE email = ${sqlString(a.developer_email)}),
    ${sqlString(a.nombre)},
    ${sqlString(a.descripcion)},
    ${sqlString(a.version)},
    ${a.precio_eur},
    ${sqlString(a.tipo_activo)},
    ${sqlString(a.categoria)}::categoria_agente,
    NULL,
    ${a.rating_promedio},
    ${a.num_valoraciones},
    ${sqlString(a.estado_auditoria)},
    ${sqlNullableString(a.hash_integridad)},
    ${sqlNullableString(a.firma_digital)}
  )`;
}).join(",\n");

const auditInserts = SEED_AGENTS.filter(
  (a) => a.estado_auditoria === "certificado" && a.hash_integridad,
)
  .map((a) => {
    const permisosJson = JSON.stringify(a.permisos_aprobados);
    return `
INSERT INTO auditorias (
  agente_id,
  resultado_global,
  logs_sandbox,
  vulnerabilidades_detectadas,
  permisos_aprobados,
  fecha_ejecucion
)
SELECT
  id,
  true,
  ${sqlString(DEFAULT_AUDIT_LOGS)},
  0,
  ${sqlString(permisosJson)}::jsonb,
  NOW()
FROM agentes
WHERE nombre = ${sqlString(a.nombre)};`;
  })
  .join("\n");

const sql = `-- =============================================================================
-- Certia — Reset + catálogo demo (ejecutar en consola SQL de Neon)
-- Generado desde src/lib/seed-catalog.ts
-- =============================================================================

-- 1) Campos de marketplace (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_agente') THEN
    CREATE TYPE categoria_agente AS ENUM (
      'rag', 'automatizacion', 'finanzas', 'compliance',
      'orquestacion', 'datos', 'seguridad', 'otros'
    );
  END IF;
END $$;

ALTER TABLE agentes
  ADD COLUMN IF NOT EXISTS categoria categoria_agente NOT NULL DEFAULT 'automatizacion',
  ADD COLUMN IF NOT EXISTS imagen_url TEXT,
  ADD COLUMN IF NOT EXISTS rating_promedio NUMERIC(2,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS num_valoraciones INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agentes_rating_promedio_check') THEN
    ALTER TABLE agentes ADD CONSTRAINT agentes_rating_promedio_check
      CHECK (rating_promedio >= 0 AND rating_promedio <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agentes_num_valoraciones_check') THEN
    ALTER TABLE agentes ADD CONSTRAINT agentes_num_valoraciones_check
      CHECK (num_valoraciones >= 0);
  END IF;
END $$;

-- 2) Limpiar datos de prueba
BEGIN;

DELETE FROM servicios_fine_tuning;
DELETE FROM transacciones;
DELETE FROM auditorias;
DELETE FROM agentes;

-- 3) Desarrolladores demo
INSERT INTO usuarios (email, nombre, rol, avatar_url)
VALUES
${developerInserts}
ON CONFLICT (email) DO UPDATE
SET nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol;

-- 4) Agentes demo (${SEED_AGENTS.length} filas)
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
VALUES
${agentValues};

-- 5) Auditorías con permisos distintos por agente
${auditInserts}

COMMIT;

-- 6) Comprobación rápida
SELECT
  (SELECT COUNT(*) FROM agentes) AS agentes,
  (SELECT COUNT(*) FROM agentes WHERE estado_auditoria = 'certificado') AS certificados,
  (SELECT COUNT(*) FROM agentes WHERE precio_eur = 0) AS gratis,
  (SELECT COUNT(*) FROM auditorias) AS auditorias;
`;

const outPath = resolve(__dirname, "seed-demo-catalog.sql");
writeFileSync(outPath, sql, "utf8");
console.log(`Escrito: ${outPath}`);
console.log(`Agentes: ${SEED_AGENTS.length}, desarrolladores: ${SEED_DEVELOPERS.length}`);
