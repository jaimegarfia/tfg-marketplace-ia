"use client";

import { useState } from "react";
import type { DeveloperDashboardData } from "@/lib/developer-dashboard";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { DeveloperHeader } from "@/components/layout/developer-header";
import {
  DeveloperPanelNav,
  type DeveloperTab,
} from "@/components/layout/developer-panel-nav";
import { TabMetrics } from "@/components/developer/tab-metrics";
import { TabAssets } from "@/components/developer/tab-assets";
import { TabPublish } from "@/components/developer/tab-publish";
import { TabAdaptations } from "@/components/developer/tab-adaptations";

interface DeveloperDashboardClientProps {
  data: DeveloperDashboardData;
}

export function DeveloperDashboardClient({ data }: DeveloperDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<DeveloperTab>("metricas");

  return (
    <MarketplaceShell>
      <DeveloperHeader
        developerName={data.developer.nombre}
        developerEmail={data.developer.email}
      />
      <DeveloperPanelNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        adaptationsCount={data.fineTuningRequests.length}
      />

      <main className="relative mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "metricas" && (
          <TabMetrics
            metrics={data.metrics}
            developerName={data.developer.nombre}
          />
        )}

        {activeTab === "activos" && (
          <TabAssets
            agentes={data.agentes}
            onPublishClick={() => setActiveTab("publicar")}
          />
        )}

        {activeTab === "publicar" && (
          <TabPublish onPublished={() => setActiveTab("activos")} />
        )}

        {activeTab === "adaptaciones" && (
          <TabAdaptations requests={data.fineTuningRequests} />
        )}
      </main>
    </MarketplaceShell>
  );
}
