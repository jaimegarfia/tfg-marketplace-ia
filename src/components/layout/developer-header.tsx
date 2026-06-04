"use client";

import Link from "next/link";
import { Shield, Store } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

export function DeveloperHeader() {
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

        <UserMenu variant="developer" />
      </div>
    </header>
  );
}
