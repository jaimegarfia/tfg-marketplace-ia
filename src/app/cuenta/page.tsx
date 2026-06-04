import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getAccountProfileAction } from "@/app/cuenta/actions";
import { CuentaSettingsClient } from "@/app/cuenta/cuenta-settings-client";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { UserMenu } from "@/components/auth/user-menu";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const profile = await getAccountProfileAction();
  if (!profile) {
    redirect("/");
  }

  return (
    <MarketplaceShell>
      <header className="sticky top-0 z-30 border-b border-neutral-800/80 bg-[#0b0d10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
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
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <CuentaSettingsClient profile={profile} />
      </main>
    </MarketplaceShell>
  );
}
