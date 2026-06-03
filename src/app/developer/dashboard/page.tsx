import { Suspense } from "react";
import { DeveloperDashboardClient } from "@/components/developer/developer-dashboard-client";
import { DeveloperDashboardGate } from "@/components/developer/developer-dashboard-gate";
import { getDeveloperDashboardFromSession } from "@/app/developer/dashboard/actions";
import DeveloperDashboardLoading from "./loading";

export const dynamic = "force-dynamic";

async function DeveloperDashboardContent() {
  const data = await getDeveloperDashboardFromSession();

  if (!data) {
    return <DeveloperDashboardGate />;
  }

  return <DeveloperDashboardClient data={data} />;
}

export default function DeveloperDashboardPage() {
  return (
    <Suspense fallback={<DeveloperDashboardLoading />}>
      <DeveloperDashboardContent />
    </Suspense>
  );
}
