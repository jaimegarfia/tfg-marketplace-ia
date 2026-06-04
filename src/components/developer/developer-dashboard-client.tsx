"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeveloperDashboardData } from "@/lib/developer-dashboard";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { DeveloperHeader } from "@/components/layout/developer-header";
import {
  DeveloperPanelNav,
  type DeveloperTab,
} from "@/components/layout/developer-panel-nav";
import { TabOverview } from "@/components/developer/tab-overview";
import { TabPublish } from "@/components/developer/tab-publish";
import { TabAdaptations } from "@/components/developer/tab-adaptations";
import { AssetManageDrawer } from "@/components/developer/asset-manage-drawer";

interface DeveloperDashboardClientProps {
  data: DeveloperDashboardData;
}

export function DeveloperDashboardClient({ data }: DeveloperDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DeveloperTab>("resumen");
  const [manageAgentId, setManageAgentId] = useState<string | null>(null);

  return (
    <MarketplaceShell>
      <div
        className="sticky top-0 z-50 bg-[#0b0d10]/95 backdrop-blur-md"
        style={{ ["--developer-chrome-height" as string]: "7.25rem" }}
      >
        <DeveloperHeader />
        <DeveloperPanelNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          adaptationsCount={data.fineTuningRequests.length}
        />
      </div>

      <main className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "resumen" && (
          <TabOverview
            metrics={data.metrics}
            developerName={data.developer.nombre}
            agentes={data.agentes}
            onPublishClick={() => setActiveTab("publicar")}
            onSelectAsset={setManageAgentId}
          />
        )}

        {activeTab === "publicar" && (
          <TabPublish
            defaultEstudioComercial={
              data.developer.empresa?.trim() || data.developer.nombre
            }
            onPublished={() => setActiveTab("resumen")}
          />
        )}

        {activeTab === "adaptaciones" && (
          <TabAdaptations requests={data.fineTuningRequests} />
        )}
      </main>

      {manageAgentId && (
        <AssetManageDrawer
          agenteId={manageAgentId}
          onClose={() => setManageAgentId(null)}
          onUpdated={() => {
            router.refresh();
          }}
        />
      )}
    </MarketplaceShell>
  );
}
