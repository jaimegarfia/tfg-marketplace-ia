import type { AgenteConAuditoria } from "@/types/database";
import { AgentCard } from "@/components/marketplace/agent-card";

interface AgentGridProps {
  agentes: AgenteConAuditoria[];
  onSelect: (agente: AgenteConAuditoria) => void;
  onAcquire?: (agente: AgenteConAuditoria) => void;
  columns?: "default" | "compact";
}

export function AgentGrid({
  agentes,
  onSelect,
  onAcquire,
  columns = "default",
}: AgentGridProps) {
  const gridClass =
    columns === "compact"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";

  return (
    <ul className={gridClass}>
      {agentes.map((agente) => (
        <li key={agente.id}>
          <AgentCard
            agente={agente}
            onSelect={onSelect}
            onAcquire={onAcquire}
          />
        </li>
      ))}
    </ul>
  );
}
