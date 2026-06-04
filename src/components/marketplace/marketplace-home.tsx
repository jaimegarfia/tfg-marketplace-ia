"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AgenteConAuditoria, CategoriaAgente } from "@/types/database";
import {
  applyCatalogQuery,
  DEFAULT_FILTERS,
  filtersToSearchParams,
  hasActiveFilters,
  parseFiltersFromSearchParams,
  type CatalogFilters,
} from "@/lib/catalog-query";
import { SiteHeader } from "@/components/layout/site-header";
import { CategoryNav } from "@/components/layout/category-nav";
import { TrustBanner } from "@/components/layout/trust-banner";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { AgentGrid } from "@/components/marketplace/agent-grid";
import { AgentGridSkeleton } from "@/components/marketplace/agent-grid-skeleton";
import { FilterBar } from "@/components/marketplace/filter-bar";
import { MarketplaceSection } from "@/components/marketplace/marketplace-section";
import { AgentDrawer } from "@/components/agent-drawer";
import { useAuth } from "@/context/auth-context";

interface MarketplaceHomeProps {
  agentes: AgenteConAuditoria[];
}

export function MarketplaceHome({ agentes }: MarketplaceHomeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const [selectedAgent, setSelectedAgent] = useState<AgenteConAuditoria | null>(
    null,
  );
  const [pendingAcquire, setPendingAcquire] = useState<AgenteConAuditoria | null>(
    null,
  );
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const CATEGORY_LOAD_MS = 320;

  const maxCatalogPrice = useMemo(
    () => Math.max(0, ...agentes.map((a) => a.precio_usd)),
    [agentes],
  );

  const updateFilters = useCallback(
    (patch: Partial<CatalogFilters>) => {
      const next = { ...filters, ...patch };
      const params = filtersToSearchParams(next);
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [filters, router],
  );

  const resetFilters = useCallback(() => {
    router.replace("/", { scroll: false });
  }, [router]);

  const filteredAgentes = useMemo(
    () => applyCatalogQuery(agentes, filters),
    [agentes, filters],
  );

  const recientes = useMemo(
    () =>
      [...agentes]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [agentes],
  );

  const gratis = useMemo(
    () => agentes.filter((a) => a.precio_usd === 0).slice(0, 4),
    [agentes],
  );

  const artefactos = useMemo(
    () =>
      agentes.filter((a) => a.tipo_activo === "runtime_artifact").slice(0, 5),
    [agentes],
  );

  const showSections = !hasActiveFilters(filters) && !filters.q;

  const handleAcquire = useCallback(
    (agente: AgenteConAuditoria) => {
      if (!user) {
        setPendingAcquire(agente);
        openAuthModal();
        return;
      }
      setSelectedAgent(agente);
    },
    [openAuthModal, user],
  );

  useEffect(() => {
    if (user && pendingAcquire) {
      setSelectedAgent(pendingAcquire);
      setPendingAcquire(null);
    }
  }, [user, pendingAcquire]);

  const handleCategoryChange = (categoria: CategoriaAgente | "todos") => {
    if (categoria === filters.categoria) return;
    setIsCategoryLoading(true);
    updateFilters({ categoria });
  };

  useEffect(() => {
    if (!isCategoryLoading) return;
    const timer = window.setTimeout(() => {
      setIsCategoryLoading(false);
    }, CATEGORY_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [isCategoryLoading, filters.categoria]);

  const handleSearchSubmit = (q: string) => {
    if (q === filters.q) return;
    updateFilters({ q });
  };

  const scrollToResults = () => {
    document.getElementById("marketplace-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <MarketplaceShell>
      <SiteHeader
        searchQuery={filters.q}
        onSearchSubmit={handleSearchSubmit}
      />
      <CategoryNav active={filters.categoria} onChange={handleCategoryChange} />
      <TrustBanner />

      <main className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {agentes.length === 0 ? (
          <div
            role="status"
            className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 px-6 py-16 text-center"
          >
            <p className="text-lg font-medium text-neutral-200">
              El catálogo está vacío
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Ejecuta la migración SQL y el endpoint de seed para poblar agentes
              certificados.
            </p>
          </div>
        ) : (
          <>
            <FilterBar
              filters={filters}
              maxPrice={maxCatalogPrice}
              onChange={updateFilters}
              onReset={resetFilters}
              resultCount={filteredAgentes.length}
            />

            {showSections && (
              <div className="mb-8 space-y-8">
                <MarketplaceSection
                  title="Destacados del marketplace"
                  subtitle="Agentes certificados listos para adquirir"
                  onAction={scrollToResults}
                >
                  <AgentGrid
                    agentes={agentes.slice(0, 5)}
                    onSelect={setSelectedAgent}
                    onAcquire={handleAcquire}
                  />
                </MarketplaceSection>

                {recientes.length > 0 && (
                  <MarketplaceSection
                    title="Recién certificados"
                    onAction={scrollToResults}
                  >
                    <AgentGrid
                      agentes={recientes}
                      onSelect={setSelectedAgent}
                      onAcquire={handleAcquire}
                      columns="compact"
                    />
                  </MarketplaceSection>
                )}

                {gratis.length > 0 && (
                  <MarketplaceSection title="Gratis">
                    <AgentGrid
                      agentes={gratis}
                      onSelect={setSelectedAgent}
                      onAcquire={handleAcquire}
                      columns="compact"
                    />
                  </MarketplaceSection>
                )}

                {artefactos.length > 0 && (
                  <MarketplaceSection
                    title="Artefactos ejecutables"
                    onAction={scrollToResults}
                  >
                    <AgentGrid
                      agentes={artefactos}
                      onSelect={setSelectedAgent}
                      onAcquire={handleAcquire}
                      columns="compact"
                    />
                  </MarketplaceSection>
                )}
              </div>
            )}

            <div id="marketplace-results" className="scroll-mt-36">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-100">
                  {hasActiveFilters(filters) || filters.q
                    ? "Resultados de búsqueda"
                    : "Explorar catálogo"}
                </h2>
                <p className="text-sm text-neutral-500">
                  {filteredAgentes.length}{" "}
                  {filteredAgentes.length === 1 ? "activo" : "activos"}
                  {filters.q ? ` para "${filters.q}"` : ""}
                </p>
              </div>

              {isCategoryLoading ? (
                <AgentGridSkeleton count={3} />
              ) : filteredAgentes.length > 0 ? (
                <AgentGrid
                  agentes={filteredAgentes}
                  onSelect={setSelectedAgent}
                  onAcquire={handleAcquire}
                />
              ) : (
                <div
                  role="status"
                  className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/80 bg-neutral-950/30 px-6 py-16 text-center"
                >
                  <p className="text-base font-medium text-neutral-300">
                    Sin resultados
                  </p>
                  <p className="mt-2 max-w-md text-sm text-neutral-500">
                    Prueba con otros términos de búsqueda o ajusta los filtros
                    de tipo y precio.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-900"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <AgentDrawer
        agente={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </MarketplaceShell>
  );
}
