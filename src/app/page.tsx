import { ArrowUpRight, Shield } from "lucide-react";
import { AGENTES_DESTACADOS, etiquetaTipoActivo, formatearPrecio } from "@/lib/mock-data";
import type { Agente, EstadoAuditoria } from "@/types/database";

const TRUST_MARKERS = [
  "100% ACID",
  "Sandbox certificado",
  "Firma de integridad",
] as const;

function estadoVisual(estado: EstadoAuditoria): {
  label: string;
  dot: string;
  text: string;
} {
  switch (estado) {
    case "certificado":
      return {
        label: "Certificado",
        dot: "bg-emerald-400/90",
        text: "text-emerald-400/90",
      };
    case "en_auditoria":
      return {
        label: "En auditoría",
        dot: "bg-neutral-500",
        text: "text-neutral-300",
      };
    case "borrador":
      return {
        label: "Borrador",
        dot: "bg-neutral-600",
        text: "text-neutral-400",
      };
    case "rechazado":
      return {
        label: "Rechazado",
        dot: "bg-neutral-700",
        text: "text-neutral-500",
      };
  }
}

function AgentRow({ agente, index }: { agente: Agente; index: number }) {
  const estado = estadoVisual(agente.estado_auditoria);

  return (
    <li className="group border-b border-neutral-800/80 py-8 transition-colors duration-300 hover:border-neutral-600/70">
      <article className="grid grid-cols-1 gap-5 md:grid-cols-[1.6fr_0.6fr_0.6fr] md:items-start">
        <div className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            {(index + 1).toString().padStart(2, "0")} · {etiquetaTipoActivo(agente.tipo_activo)}
          </p>
          <h3 className="text-3xl font-medium tracking-tight text-neutral-100 sm:text-4xl">
            {agente.nombre}
          </h3>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-neutral-400">
            {agente.descripcion}
          </p>
        </div>

        <div className="space-y-2 md:pt-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Precio
          </p>
          <p className="text-xl font-medium tracking-tight text-neutral-100">
            {formatearPrecio(agente.precio_usd)}
          </p>
        </div>

        <div className="space-y-2 md:pt-2">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Estado
          </p>
          <p className={`inline-flex items-center gap-2 text-sm ${estado.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
            {estado.label}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-600">
            v{agente.version}
          </p>
        </div>
      </article>
    </li>
  );
}

export default function Home() {
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
          <a
            href="#catalogo"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-300 transition-colors hover:text-neutral-100"
          >
            Explorar
            <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden="true" />
          </a>
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

            <ul className="divide-y divide-transparent">
              {AGENTES_DESTACADOS.map((agente, index) => (
                <AgentRow key={agente.id} agente={agente} index={index} />
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
