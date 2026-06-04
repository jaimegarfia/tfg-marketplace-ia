import type { CategoriaAgente } from "@/types/database";
import {
  getAssetVisualIconOption,
  isAssetVisualIconId,
  resolveAssetCardVisual,
} from "@/lib/asset-visual-icons";
import { getPlaceholder } from "@/lib/placeholders";

interface AssetVisualThumbnailProps {
  imagenUrl: string | null;
  categoria: CategoriaAgente;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASS = {
  sm: { box: "h-14 w-14", icon: 22 },
  md: { box: "h-20 w-20", icon: 28 },
} as const;

export function AssetVisualThumbnail({
  imagenUrl,
  categoria,
  size = "sm",
  className = "",
}: AssetVisualThumbnailProps) {
  const visual = resolveAssetCardVisual(imagenUrl, categoria);
  const dims = SIZE_CLASS[size];

  if (visual.kind === "image") {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/60 ${dims.box} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.url}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const gradient =
    visual.kind === "preset"
      ? visual.option.gradient
      : visual.gradient;
  const Icon =
    visual.kind === "preset" ? visual.option.Icon : visual.Icon;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-800/80 bg-gradient-to-br ${gradient} ${dims.box} ${className}`}
      title={
        visual.kind === "preset"
          ? visual.option.label
          : getPlaceholder(categoria).label
      }
    >
      <Icon
        size={dims.icon}
        strokeWidth={1.25}
        className="text-neutral-200/80"
        aria-hidden="true"
      />
    </div>
  );
}

/** Vista previa pequeña para un id de icono predefinido (formulario de edición). */
export function AssetIconIdPreview({
  iconId,
  className = "",
}: {
  iconId: string;
  className?: string;
}) {
  if (!isAssetVisualIconId(iconId)) {
    return null;
  }
  const option = getAssetVisualIconOption(iconId);
  const Icon = option.Icon;

  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-800/80 bg-gradient-to-br ${option.gradient} ${className}`}
    >
      <Icon size={20} strokeWidth={1.25} className="text-neutral-200/80" aria-hidden="true" />
    </div>
  );
}
