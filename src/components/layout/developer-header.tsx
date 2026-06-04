"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowLeft, LogOut, Shield, Store } from "lucide-react";
import { clearDeveloperSession } from "@/app/developer/dashboard/actions";

interface DeveloperHeaderProps {
  developerName: string;
  developerEmail: string;
}

export function DeveloperHeader({
  developerName,
  developerEmail,
}: DeveloperHeaderProps) {
  const [isSigningOut, startSignOut] = useTransition();

  const initials = developerName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const handleSignOut = () => {
    startSignOut(async () => {
      await clearDeveloperSession();
      window.location.href = "/";
    });
  };

  return (
    <header className="border-b border-neutral-800/80 bg-[#0b0d10]/95">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
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

          <span
            className="hidden h-5 w-px shrink-0 bg-neutral-800 sm:block"
            aria-hidden="true"
          />

          <span className="hidden items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/[0.07] px-2.5 py-1 text-xs font-medium text-emerald-300/90 sm:inline-flex">
            <Store size={13} strokeWidth={1.5} aria-hidden="true" />
            Consola de desarrollador
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-lg border border-neutral-800/80 px-3 py-2 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100 md:inline-flex"
          >
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            Ir al marketplace
          </Link>

          <div className="flex items-center gap-2.5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 py-1.5 pl-2 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-800/80 text-[10px] font-medium uppercase tracking-wide text-neutral-300">
              {initials || "DV"}
            </span>
            <div className="hidden min-w-0 leading-tight sm:block">
              <p className="max-w-[160px] truncate text-xs font-medium text-neutral-200">
                {developerName}
              </p>
              <p className="max-w-[160px] truncate text-[10px] text-neutral-500">
                {developerEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Cerrar sesión de desarrollador"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800/80 text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200 disabled:opacity-50"
          >
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
