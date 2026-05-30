"use client";

import type { TipoActivo } from "@/types/database";

type FilterValue = "todos" | TipoActivo;

interface FilterOption {
  label: string;
  value: FilterValue;
}

const FILTERS: readonly FilterOption[] = [
  { label: "Todos", value: "todos" },
  { label: "Artefactos", value: "runtime_artifact" },
  { label: "Workflows", value: "reference_architecture" },
] as const;

interface FilterTabsProps {
  active: FilterValue;
  onChange: (value: FilterValue) => void;
}

export type { FilterValue };

export function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Filtrar por tipo de activo"
      className="flex items-center gap-6 border-b border-neutral-800/60 pb-px"
    >
      {FILTERS.map((filter) => {
        const isActive = active === filter.value;

        return (
          <button
            key={filter.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.value)}
            className={`
              relative pb-3 font-mono text-xs uppercase tracking-widest
              transition-all duration-300 focus-visible:outline-none
              focus-visible:ring-1 focus-visible:ring-neutral-500 focus-visible:ring-offset-2
              focus-visible:ring-offset-[#0b0d10]
              ${
                isActive
                  ? "text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }
            `}
          >
            {filter.label}

            {/* Línea inferior microscópica para estado activo */}
            <span
              className={`
                absolute bottom-0 left-0 h-px w-full transition-all duration-300
                ${isActive ? "bg-neutral-100 opacity-100" : "bg-transparent opacity-0"}
              `}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </nav>
  );
}
