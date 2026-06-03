import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface MarketplaceSectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function MarketplaceSection({
  title,
  subtitle,
  actionLabel = "Ver más",
  onAction,
  children,
}: MarketplaceSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-100 sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex shrink-0 items-center gap-1 text-sm text-emerald-400/90 transition hover:text-emerald-300"
          >
            {actionLabel}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
