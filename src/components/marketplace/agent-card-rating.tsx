import { Star } from "lucide-react";
import { formatearRating } from "@/lib/catalog-format";

interface AgentCardRatingProps {
  ratingPromedio: number;
  numValoraciones: number;
}

export function AgentCardRating({
  ratingPromedio,
  numValoraciones,
}: AgentCardRatingProps) {
  if (numValoraciones > 0) {
    return (
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex items-center text-amber-400/90">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              strokeWidth={1.5}
              className={
                i < Math.round(ratingPromedio)
                  ? "fill-amber-400/90 text-amber-400/90"
                  : "text-neutral-700"
              }
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="text-xs text-amber-400/80">
          {formatearRating(ratingPromedio)}
        </span>
        <span className="text-xs text-neutral-500">({numValoraciones})</span>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <span className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300/90 backdrop-blur-sm">
        NUEVO
      </span>
      <span className="ml-2 text-[11px] text-neutral-600">
        Sin valorar por usuarios
      </span>
    </div>
  );
}
