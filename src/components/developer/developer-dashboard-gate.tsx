"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Shield, Store } from "lucide-react";
import { useMockAuth } from "@/context/mock-auth-context";
import { establishDeveloperSession } from "@/app/developer/dashboard/actions";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";

export function DeveloperDashboardGate() {
  const { openAuthModal } = useMockAuth();
  const [email, setEmail] = useState("labs@certia.local");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDirectAccess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await establishDeveloperSession(email);
      if (result?.ok === false) {
        setError(result.error);
      }
    });
  };

  return (
    <MarketplaceShell>
      <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#0b0d10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800/80 px-3 py-2 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
          >
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            Ir al marketplace
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-[1400px] flex-col items-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-400/90">
              <Store size={20} strokeWidth={1.25} aria-hidden="true" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-100 sm:text-2xl">
              Consola de desarrollador
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
              Accede para publicar agentes, revisar auditorías de sandbox y
              gestionar las solicitudes de adaptación de tus clientes.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-6 sm:p-8">
            <form onSubmit={handleDirectAccess} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="developer-email"
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                >
                  Email de desarrollador
                </label>
                <input
                  id="developer-email"
                  type="email"
                  required
                  value={email}
                  disabled={isPending}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="labs@certia.local"
                  className="w-full rounded-md border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300/90"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-900"
                      aria-hidden="true"
                    />
                    Validando acceso...
                  </>
                ) : (
                  <>
                    Entrar a la consola
                    <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-neutral-600">
              Cuentas demo: labs@certia.local · nova@certia.local
            </p>

            <div className="mt-6 border-t border-neutral-800/60 pt-5 text-center">
              <button
                type="button"
                onClick={() => openAuthModal("developer")}
                disabled={isPending}
                className="text-xs text-neutral-500 transition hover:text-neutral-300 disabled:opacity-50"
              >
                Prefiero usar el modal de inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </main>
    </MarketplaceShell>
  );
}
