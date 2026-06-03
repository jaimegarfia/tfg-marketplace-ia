"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import type { FineTuningRequestRow } from "@/lib/developer-dashboard";
import type { EstadoProcesoFineTuning } from "@/types/database";
import { updateFineTuningEstadoAction } from "@/app/developer/dashboard/actions";

interface TabAdaptationsProps {
  requests: FineTuningRequestRow[];
}

const ESTADO_OPTIONS: ReadonlyArray<{
  value: EstadoProcesoFineTuning;
  label: string;
}> = [
  { value: "solicitado", label: "Solicitado" },
  { value: "en_desarrollo", label: "En desarrollo" },
  { value: "entregado", label: "Entregado" },
  { value: "disputa", label: "Disputa" },
];

const ESTADO_STYLES: Record<EstadoProcesoFineTuning, string> = {
  solicitado: "border-sky-500/25 bg-sky-500/10 text-sky-300/90",
  en_desarrollo: "border-amber-500/25 bg-amber-500/10 text-amber-300/90",
  entregado: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300/90",
  disputa: "border-red-500/25 bg-red-500/10 text-red-300/90",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function TabAdaptations({ requests }: TabAdaptationsProps) {
  const [items, setItems] = useState(requests);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEstadoChange = (
    servicioId: string,
    estado: EstadoProcesoFineTuning,
  ) => {
    setError(null);
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === servicioId ? { ...item, estado_proceso: estado } : item,
      ),
    );

    startTransition(async () => {
      const result = await updateFineTuningEstadoAction(servicioId, estado);
      if (!result.ok) {
        setItems(previous);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
            Solicitudes de adaptación
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Peticiones de fine-tuning enviadas por clientes desde el marketplace.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-neutral-800/80 bg-neutral-900/50 px-3 py-1 text-xs text-neutral-400">
          {items.length} solicitudes
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300/90"
        >
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-xl border border-neutral-800/80 bg-neutral-950/30 px-6 py-16 text-center"
        >
          <Sparkles
            size={22}
            strokeWidth={1.25}
            className="text-neutral-600"
            aria-hidden="true"
          />
          <p className="mt-3 text-base font-medium text-neutral-300">
            Sin solicitudes activas
          </p>
          <p className="mt-2 max-w-md text-sm text-neutral-500">
            Cuando un cliente envíe una petición desde la pestaña Servicios de
            Adaptación del marketplace, aparecerá aquí para que la gestiones.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-neutral-800/80 bg-[var(--surface)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ESTADO_STYLES[request.estado_proceso]}`}
                  >
                    {ESTADO_OPTIONS.find(
                      (option) => option.value === request.estado_proceso,
                    )?.label ?? request.estado_proceso}
                  </span>
                  <h3 className="text-base font-medium text-neutral-100">
                    {request.agente_nombre}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Actualizada {formatDate(request.updated_at)}
                  </p>
                </div>

                <div className="w-full lg:w-52">
                  <label
                    htmlFor={`estado-${request.id}`}
                    className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Cambiar estado
                  </label>
                  <select
                    id={`estado-${request.id}`}
                    value={request.estado_proceso}
                    disabled={isPending}
                    onChange={(event) =>
                      handleEstadoChange(
                        request.id,
                        event.target.value as EstadoProcesoFineTuning,
                      )
                    }
                    className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2 text-sm text-neutral-200 outline-none transition focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ESTADO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-neutral-800/60 bg-neutral-950/50 px-3 py-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Requisitos del cliente
                </p>
                <p className="text-sm leading-relaxed text-neutral-300">
                  {request.contexto_privado_desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
