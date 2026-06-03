import { Suspense } from "react";
import { getCatalogoAgentes } from "@/lib/catalog-data";
import { MarketplaceHome } from "@/components/marketplace/marketplace-home";

export const dynamic = "force-dynamic";

function MarketplaceSkeleton() {
  return (
    <div className="min-h-dvh bg-[#0b0d10]">
      <div className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#0b0d10]/95 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] animate-pulse gap-4">
          <div className="h-8 w-24 rounded bg-neutral-800" />
          <div className="h-10 flex-1 rounded bg-neutral-800" />
          <div className="h-8 w-20 rounded bg-neutral-800" />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/40"
            >
              <div className="aspect-[4/3] bg-neutral-800" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-2/3 rounded bg-neutral-800" />
                <div className="h-4 w-full rounded bg-neutral-800" />
                <div className="h-4 w-1/2 rounded bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const agentes = await getCatalogoAgentes();

  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceHome agentes={agentes} />
    </Suspense>
  );
}
