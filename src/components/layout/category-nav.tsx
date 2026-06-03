"use client";

import type { CategoriaAgente } from "@/types/database";
import { CATEGORIAS_AGENTE, etiquetaCategoria } from "@/lib/catalog-format";

interface CategoryNavProps {
  active: CategoriaAgente | "todos";
  onChange: (categoria: CategoriaAgente | "todos") => void;
}

export function CategoryNav({ active, onChange }: CategoryNavProps) {
  const items: Array<{ value: CategoriaAgente | "todos"; label: string }> = [
    { value: "todos", label: "Todos" },
    ...CATEGORIAS_AGENTE.map((cat) => ({
      value: cat,
      label: etiquetaCategoria(cat),
    })),
  ];

  return (
    <nav
      aria-label="Categorías del marketplace"
      className="border-b border-neutral-800/60 bg-neutral-950/50"
    >
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {items.map((item) => {
          const isActive = active === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              aria-current={isActive ? "page" : undefined}
              className={`
                shrink-0 rounded-md px-3 py-1.5 text-sm transition
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500
                ${
                  isActive
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }
              `}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
