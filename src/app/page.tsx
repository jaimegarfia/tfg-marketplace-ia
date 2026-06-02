import { ArrowUpRight, Shield } from "lucide-react";
import { query } from "@/lib/db";
import type { Agente, AgenteConAuditoria, TipoActivo } from "@/types/database";
import {
  resolveCatalogAuditoriaFromDatabase,
  type AgenteRowAuditFields,
} from "@/lib/audit-catalog";
import { CatalogClient } from "@/components/catalog-client";
import { UserNav } from "@/components/user-nav";

export const dynamic = "force-dynamic";

const TRUST_MARKERS = [
  "100% ACID",
  "Sandbox certificado",
  "Firma de integridad",
] as const;

interface AgenteRowRaw extends AgenteRowAuditFields {
  id: string;
  desarrollador_id: string;
  nombre: string;
  descripcion: string;
  version: string;
  precio_usd: string | number;
  tipo_activo: TipoActivo;
  estado_auditoria: Agente["estado_auditoria"];
  hash_integridad: string | null;
  firma_digital: string | null;
  created_at: string;
}

async function getCatalogoAgentes(): Promise<AgenteConAuditoria[]> {
  try {
    const rows = await query<AgenteRowRaw>(
      `
        SELECT
          a.id::text AS id,
          a.desarrollador_id::text AS desarrollador_id,
          a.nombre,
          a.descripcion,
          a.version,
          a.precio_usd,
          a.tipo_activo,
          a.estado_auditoria,
          a.hash_integridad,
          a.firma_digital,
          a.created_at::text AS created_at,
          au.resultado_global AS audit_resultado,
          au.logs_sandbox AS audit_logs,
          au.vulnerabilidades_detectadas AS audit_vulnerabilidades,
          au.permisos_aprobados AS audit_permisos,
          au.fecha_ejecucion::text AS audit_fecha
        FROM agentes a
        JOIN LATERAL (
          SELECT
            resultado_global,
            logs_sandbox,
            vulnerabilidades_detectadas,
            permisos_aprobados,
            fecha_ejecucion
          FROM auditorias
          WHERE agente_id = a.id
          ORDER BY fecha_ejecucion DESC
          LIMIT 1
        ) au ON true
        WHERE a.estado_auditoria = 'certificado'
        ORDER BY a.created_at DESC, a.nombre ASC
        LIMIT 24
      `,
    );

    const agentes: AgenteConAuditoria[] = [];
    for (const row of rows) {
      const agente: Agente = {
        id: row.id,
        desarrollador_id: row.desarrollador_id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        version: row.version,
        precio_usd: (() => {
          if (typeof row.precio_usd === "number") return row.precio_usd;
          const parsed = Number.parseFloat(row.precio_usd);
          return Number.isFinite(parsed) ? parsed : 0;
        })(),
        tipo_activo: row.tipo_activo,
        estado_auditoria: row.estado_auditoria,
        hash_integridad: row.hash_integridad,
        firma_digital: row.firma_digital,
        created_at: row.created_at,
      };

      const { auditoria, hash_integridad } = resolveCatalogAuditoriaFromDatabase(
        agente,
        row,
      );

      if (!auditoria) continue;

      agentes.push({
        ...agente,
        hash_integridad,
        auditoria,
      });
    }
    return agentes;
  } catch (error) {
    console.error(
      "[catalogo] No se pudieron cargar agentes desde Neon.",
      error,
    );
    return [];
  }
}

export default async function Home() {
  const agentes = await getCatalogoAgentes();

  return (
    <div className="relative min-h-dvh bg-[#0b0d10] text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 fade-edge" />

      <header className="sticky top-0 z-20 border-b border-neutral-800/80 bg-black/35 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="#" className="inline-flex items-center gap-2">
            <Shield
              size={16}
              strokeWidth={1.25}
              className="text-neutral-400 transition-colors"
              aria-hidden="true"
            />
            <span className="text-base font-medium tracking-tight text-neutral-200">
              Certia
            </span>
          </a>

          <div className="flex items-center gap-5">
            <a
              href="#catalogo"
              className="hidden items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-200 sm:inline-flex"
            >
              Explorar
              <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden="true" />
            </a>
            <UserNav />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-20 sm:pt-28">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Plataforma agnóstica · Seguridad por diseño
          </p>
          <h1 className="mt-6 max-w-6xl text-[clamp(3rem,11vw,8.75rem)] font-medium leading-none tracking-tighter text-neutral-100">
            Comercialización y certificación segura de agentes de IA.
          </h1>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr] md:items-end">
            <p className="max-w-3xl text-pretty text-lg leading-relaxed text-neutral-400 sm:text-xl">
              Un marketplace neutral para negocio y compliance: auditoría en sandbox,
              transacciones ACID y trazabilidad criptográfica en una experiencia
              visual de baja carga cognitiva.
            </p>
            <a
              href="#catalogo"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100/95 px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white"
            >
              Entrar al catálogo
              <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden="true" />
            </a>
          </div>

          <div
            id="seguridad"
            className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-neutral-800/70 pt-6"
          >
            {TRUST_MARKERS.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-neutral-500"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/85" />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section id="catalogo" className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
            <div className="space-y-4 md:sticky md:top-24 md:self-start">
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                Catálogo
              </p>
              <h2 className="text-4xl font-medium leading-none tracking-tighter text-neutral-100">
                Selección auditada
              </h2>
              <p className="text-pretty text-sm leading-relaxed text-neutral-400">
                Flujo editorial, sin cajas innecesarias. Cada activo se presenta
                con señal mínima y legible: tipo, precio y estado criptográfico.
              </p>
            </div>

            <div>
              {agentes.length > 0 ? (
                <CatalogClient agentes={agentes} />
              ) : (
                <p className="border-b border-neutral-800/80 py-8 text-sm text-neutral-500">
                  El catálogo aún no tiene agentes sembrados. Ejecuta el endpoint de
                  seed para poblar datos de prueba.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
