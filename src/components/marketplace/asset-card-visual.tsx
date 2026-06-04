import type { CategoriaAgente } from "@/types/database";
import { resolveAssetCardVisual } from "@/lib/asset-visual-icons";

interface AssetCardVisualProps {
  imagenUrl: string | null;
  categoria: CategoriaAgente;
}

export function AssetCardVisual({ imagenUrl, categoria }: AssetCardVisualProps) {
  const visual = resolveAssetCardVisual(imagenUrl, categoria);

  const gradient =
    visual.kind === "preset"
      ? visual.option.gradient
      : visual.kind === "category"
        ? visual.gradient
        : "from-neutral-800/90 to-neutral-900";

  const Icon =
    visual.kind === "preset"
      ? visual.option.Icon
      : visual.kind === "category"
        ? visual.Icon
        : null;

  return (
    <div
      className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${gradient}`}
    >
      {visual.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visual.url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        Icon && (
          <Icon
            size={40}
            strokeWidth={1.25}
            className="text-neutral-300/70"
            aria-hidden="true"
          />
        )
      )}
    </div>
  );
}
