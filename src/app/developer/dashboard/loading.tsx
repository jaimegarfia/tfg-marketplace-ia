import { MarketplaceShell } from "@/components/layout/marketplace-shell";

export default function DeveloperDashboardLoading() {
  return (
    <MarketplaceShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-emerald-400"
            aria-hidden="true"
          />
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Cargando panel...
          </p>
        </div>
      </div>
    </MarketplaceShell>
  );
}
