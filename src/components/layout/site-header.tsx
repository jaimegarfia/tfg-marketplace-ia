import Link from "next/link";
import { LayoutDashboard, Shield, ShoppingCart } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { SearchBar } from "@/components/marketplace/search-bar";

interface SiteHeaderProps {
  searchQuery: string;
  onSearchSubmit: (value: string) => void;
}

export function SiteHeader({ searchQuery, onSearchSubmit }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#0b0d10]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
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

        <SearchBar
          value={searchQuery}
          onSubmit={onSearchSubmit}
          className="min-w-0 flex-1"
        />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/developer/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.07] px-2.5 text-xs font-medium text-emerald-300/90 transition hover:border-emerald-500/45 hover:bg-emerald-500/10 sm:px-3"
          >
            <LayoutDashboard size={14} strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:inline">Vender en Certia</span>
            <span className="sm:hidden">Vender</span>
          </Link>

          <button
            type="button"
            aria-label="Cesta (próximamente)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800/80 text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200"
          >
            <ShoppingCart size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
