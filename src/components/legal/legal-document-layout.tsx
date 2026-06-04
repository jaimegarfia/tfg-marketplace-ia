import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";

interface LegalDocumentLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalDocumentLayout({
  title,
  updatedAt,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <MarketplaceShell>
      <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-[#0b0d10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
          >
            <Shield
              size={18}
              strokeWidth={1.25}
              className="text-emerald-400/90"
              aria-hidden="true"
            />
            <span className="text-lg font-semibold tracking-tight text-neutral-100">
              Certia
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 transition hover:text-neutral-200"
          >
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            Volver al marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Documento legal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-50">
          {title}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Última actualización: {updatedAt}
        </p>

        <article className="prose-legal mt-10 space-y-6 text-sm leading-relaxed text-neutral-300">
          {children}
        </article>

        <footer className="mt-14 flex flex-wrap gap-4 border-t border-neutral-800/80 pt-6 text-xs text-neutral-500">
          <Link
            href="/legal/terminos"
            className="transition hover:text-neutral-300"
          >
            Términos de servicio
          </Link>
          <Link
            href="/legal/privacidad"
            className="transition hover:text-neutral-300"
          >
            Política de privacidad
          </Link>
        </footer>
      </main>
    </MarketplaceShell>
  );
}
