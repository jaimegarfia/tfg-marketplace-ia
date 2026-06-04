"use client";

import {
  ASSET_VISUAL_ICON_OPTIONS,
  type AssetVisualIconId,
} from "@/lib/asset-visual-icons";

interface AssetVisualIconPickerProps {
  value: AssetVisualIconId;
  onChange: (value: AssetVisualIconId) => void;
  disabled?: boolean;
}

export function AssetVisualIconPicker({
  value,
  onChange,
  disabled,
}: AssetVisualIconPickerProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className={LABEL_CLASS}>Icono visual del activo</legend>
      <div
        role="radiogroup"
        aria-label="Icono visual del activo"
        className="grid grid-cols-4 gap-2 sm:grid-cols-7"
      >
        {ASSET_VISUAL_ICON_OPTIONS.map((option) => {
          const selected = value === option.id;
          const Icon = option.Icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`
                flex flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2.5 transition
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  selected
                    ? "border-emerald-500/70 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "border-neutral-800/80 bg-neutral-950/50 hover:border-neutral-600 hover:bg-neutral-900/80"
                }
              `}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br ${option.gradient}`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.25}
                  className="text-neutral-200/90"
                  aria-hidden="true"
                />
              </span>
              <span
                className={`line-clamp-2 text-center text-[9px] leading-tight ${
                  selected ? "text-emerald-300/90" : "text-neutral-500"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const LABEL_CLASS =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-neutral-500";
