import type { ReactNode } from "react";

interface MarketplaceShellProps {
  children: ReactNode;
}

/** Contenedor visual compartido entre marketplace y panel de desarrollador. */
export function MarketplaceShell({ children }: MarketplaceShellProps) {
  return (
    <div className="relative min-h-dvh bg-[#0b0d10] text-neutral-100">
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-20 fade-edge"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
