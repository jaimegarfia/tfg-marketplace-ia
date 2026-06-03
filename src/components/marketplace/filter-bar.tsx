"use client";

import type { TipoActivo } from "@/types/database";
import type { CatalogFilters, SortOption } from "@/lib/catalog-query";
import {
  filterChipClass,
  PriceRangeFilter,
} from "@/components/marketplace/price-range-filter";

interface FilterBarProps {
  filters: CatalogFilters;
  maxPrice: number;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
  resultCount: number;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "relevancia", label: "Relevancia" },
  { value: "recientes", label: "Más recientes" },
  { value: "rating", label: "Mejor valorados" },
  { value: "precio_asc", label: "Precio ↑" },
  { value: "precio_desc", label: "Precio ↓" },
];

const TIPO_OPTIONS: Array<{ value: TipoActivo | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "runtime_artifact", label: "Artefactos" },
  { value: "reference_architecture", label: "Workflows" },
];

export function FilterBar({
  filters,
  maxPrice,
  onChange,
  onReset,
  resultCount,
}: FilterBarProps) {
  const hasExtraFilters =
    filters.tipo !== "todos" ||
    filters.soloGratis ||
    filters.precioMin !== null ||
    filters.precioMax !== null ||
    filters.sort !== "relevancia";

  const toggleGratis = () => {
    if (filters.soloGratis) {
      onChange({ soloGratis: false });
      return;
    }
    onChange({
      soloGratis: true,
      precioMin: null,
      precioMax: null,
    });
  };

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="sort-select"
            className="shrink-0 text-xs text-neutral-500"
          >
            Ordenar
          </label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as SortOption })
            }
            className="rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-sm text-neutral-200 focus:border-neutral-600 focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div
          className="hidden h-5 w-px bg-neutral-800 sm:block"
          aria-hidden="true"
        />

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filtrar por tipo"
        >
          {TIPO_OPTIONS.map((option) => {
            const active = filters.tipo === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ tipo: option.value })}
                className={filterChipClass(active)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          className="hidden h-5 w-px bg-neutral-800 sm:block"
          aria-hidden="true"
        />

        <button
          type="button"
          aria-pressed={filters.soloGratis}
          onClick={toggleGratis}
          className={filterChipClass(filters.soloGratis)}
        >
          Gratis
        </button>

        <div
          className="hidden h-5 w-px bg-neutral-800 md:block"
          aria-hidden="true"
        />

        <PriceRangeFilter
          min={filters.precioMin}
          max={filters.precioMax}
          maxPrice={maxPrice}
          disabled={filters.soloGratis}
          onChange={(precioMin, precioMax) =>
            onChange({ precioMin, precioMax, soloGratis: false })
          }
        />

        <div className="ml-auto flex items-center gap-3">
          {hasExtraFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-neutral-500 transition hover:text-neutral-300"
            >
              Limpiar filtros
            </button>
          )}
          <span className="text-xs text-neutral-500">
            {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
          </span>
        </div>
      </div>
    </div>
  );
}
