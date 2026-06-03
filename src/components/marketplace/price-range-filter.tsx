"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatearPrecio } from "@/lib/catalog-format";

interface PriceRangeFilterProps {
  min: number | null;
  max: number | null;
  maxPrice: number;
  disabled?: boolean;
  onChange: (min: number | null, max: number | null) => void;
}

export function PriceRangeFilter({
  min,
  max,
  maxPrice,
  disabled = false,
  onChange,
}: PriceRangeFilterProps) {
  const ceiling = Math.max(maxPrice, 1);
  const lower = min ?? 0;
  const upper = max ?? ceiling;

  const [localMin, setLocalMin] = useState(lower);
  const [localMax, setLocalMax] = useState(upper);
  const valuesRef = useRef({ min: lower, max: upper });

  useEffect(() => {
    setLocalMin(min ?? 0);
    setLocalMax(max ?? ceiling);
  }, [min, max, ceiling]);

  useEffect(() => {
    valuesRef.current = { min: localMin, max: localMax };
  }, [localMin, localMax]);

  const minPercent = (localMin / ceiling) * 100;
  const maxPercent = (localMax / ceiling) * 100;

  const label = useMemo(() => {
    const hasMin = min !== null;
    const hasMax = max !== null;
    if (!hasMin && !hasMax) return "Cualquier precio";
    if (hasMin && hasMax) {
      return `${formatearPrecio(min!)} – ${formatearPrecio(max!)}`;
    }
    if (hasMin) return `Desde ${formatearPrecio(min!)}`;
    return `Hasta ${formatearPrecio(max!)}`;
  }, [min, max]);

  const commit = () => {
    const { min: nextMin, max: nextMax } = valuesRef.current;
    const orderedMin = Math.min(nextMin, nextMax);
    const orderedMax = Math.max(nextMin, nextMax);
    onChange(
      orderedMin <= 0 ? null : orderedMin,
      orderedMax >= ceiling ? null : orderedMax,
    );
  };

  if (disabled) {
    return (
      <span className="text-xs text-neutral-600">Precio fijado en Gratis</span>
    );
  }

  return (
    <div className="flex min-w-[180px] flex-col gap-2 sm:min-w-[220px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-500">Precio</span>
        <span className="text-xs font-medium text-neutral-300">{label}</span>
      </div>

      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-800" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-500/70"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(maxPercent - minPercent, 0)}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={ceiling}
          step={1}
          value={localMin}
          aria-label="Precio mínimo"
          onChange={(event) => {
            const value = Number(event.target.value);
            const nextMax = Math.max(value, localMax);
            setLocalMin(value);
            setLocalMax(nextMax);
          }}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="range-thumb pointer-events-none absolute inset-0 z-20 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
        />
        <input
          type="range"
          min={0}
          max={ceiling}
          step={1}
          value={localMax}
          aria-label="Precio máximo"
          onChange={(event) => {
            const value = Number(event.target.value);
            const nextMin = Math.min(value, localMin);
            setLocalMax(value);
            setLocalMin(nextMin);
          }}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="range-thumb pointer-events-none absolute inset-0 z-30 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
        />
      </div>

      <div className="flex justify-between text-[10px] text-neutral-600">
        <span>{formatearPrecio(0)}</span>
        <span>{formatearPrecio(ceiling)}</span>
      </div>
    </div>
  );
}

export function filterChipClass(active: boolean): string {
  return `
    rounded-md px-2.5 py-1.5 text-xs transition
    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500
    ${
      active
        ? "bg-neutral-800 text-neutral-100"
        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
    }
  `;
}
