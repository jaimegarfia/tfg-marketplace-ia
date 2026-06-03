"use client";

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

interface DeveloperDashboardClientProps {
  data: DeveloperDashboardData;
}

export function DeveloperDashboardClient({ data }: DeveloperDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<DeveloperTab>("resumen");

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
        {activeTab === "resumen" && (
          <TabOverview
            metrics={data.metrics}
            developerName={data.developer.nombre}
            agentes={data.agentes}
            onPublishClick={() => setActiveTab("publicar")}
          />
        )}

        {activeTab === "publicar" && (
          <TabPublish onPublished={() => setActiveTab("resumen")} />
        )}

        {activeTab === "adaptaciones" && (
          <TabAdaptations requests={data.fineTuningRequests} />
        )}
      </main>
    </MarketplaceShell>
  );
}
