interface AgentGridSkeletonProps {
  count?: number;
  columns?: "default" | "compact";
}

export function AgentGridSkeleton({
  count = 3,
  columns = "default",
}: AgentGridSkeletonProps) {
  const gridClass =
    columns === "compact"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";

  return (
    <ul
      className={gridClass}
      aria-busy="true"
      aria-label="Cargando catálogo"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <div className="animate-pulse overflow-hidden rounded-xl border border-neutral-800/80 bg-[var(--surface)]">
            <div className="aspect-[4/3] bg-neutral-800/80" />
            <div className="space-y-3 p-4">
              <div className="h-2.5 w-1/3 rounded bg-neutral-800" />
              <div className="h-4 w-full rounded bg-neutral-800" />
              <div className="h-3 w-2/3 rounded bg-neutral-800/80" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((__, i) => (
                  <div key={i} className="h-2.5 w-2.5 rounded bg-neutral-800/70" />
                ))}
              </div>
              <div className="h-5 w-1/4 rounded bg-neutral-800" />
              <div className="flex gap-2 pt-1">
                <div className="h-8 flex-1 rounded-md bg-neutral-800/70" />
                <div className="h-8 flex-1 rounded-md bg-neutral-800" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
