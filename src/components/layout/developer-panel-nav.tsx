"use client";

import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Sparkles, Upload } from "lucide-react";

export type DeveloperTab = "resumen" | "publicar" | "adaptaciones";

interface DeveloperPanelNavProps {
  activeTab: DeveloperTab;
  onTabChange: (tab: DeveloperTab) => void;
  adaptationsCount: number;
}

const TABS: ReadonlyArray<{
  id: DeveloperTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "publicar", label: "Publicar activo", icon: Upload },
  { id: "adaptaciones", label: "Adaptaciones", icon: Sparkles },
];

export function DeveloperPanelNav({
  activeTab,
  onTabChange,
  adaptationsCount,
}: DeveloperPanelNavProps) {
  return (
    <nav
      role="tablist"
      aria-label="Secciones del panel de desarrollador"
      className="border-b border-neutral-800/60 bg-neutral-950/95"
    >
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`
                inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500
                ${
                  isActive
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }
              `}
            >
              <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
              {tab.label}
              {tab.id === "adaptaciones" && adaptationsCount > 0 && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/20 px-1 text-[10px] font-medium text-emerald-300/90">
                  {adaptationsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
