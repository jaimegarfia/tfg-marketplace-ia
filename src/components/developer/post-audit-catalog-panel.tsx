"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { saveAssetCatalogDetailsAction } from "@/app/developer/dashboard/actions";

interface PostAuditCatalogPanelProps {
  agenteId: string;
  agenteNombre: string;
  initialAdmiteAdaptacion: boolean;
  initialGuiaDespliegue?: string;
  mode?: "required" | "optional";
  onSaved: () => void;
}

export function PostAuditCatalogPanel({
  agenteId,
  agenteNombre,
  initialAdmiteAdaptacion,
  initialGuiaDespliegue = "",
  mode = "required",
  onSaved,
}: PostAuditCatalogPanelProps) {
  const isOptional = mode === "optional";
  const [guiaDespliegue, setGuiaDespliegue] = useState(initialGuiaDespliegue);
  const [admiteAdaptacion, setAdmiteAdaptacion] = useState(initialAdmiteAdaptacion);

  useEffect(() => {
    setGuiaDespliegue(initialGuiaDespliegue);
  }, [initialGuiaDespliegue]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await saveAssetCatalogDetailsAction({
        agenteId,
        guiaDespliegue,
        admiteAdaptacion,
      });

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setSaved(true);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la guía de despliegue.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={18}
            className="shrink-0 text-emerald-400/90"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-sm font-medium text-emerald-200/90">
              Guía publicada en el marketplace
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Los compradores verán tus instrucciones en la pestaña «Guía de
              Despliegue» de {agenteNombre}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5"
    >
      <div className="flex items-start gap-3">
        <BookOpen
          size={18}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-emerald-400/80"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-sm font-medium text-neutral-100">
            {isOptional
              ? "Guía de despliegue (opcional)"
              : "Completar publicación en catálogo"}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">
            {isOptional
              ? `Ya tienes instrucciones publicadas para ${agenteNombre}. Edítalas solo si esta versión cambia cómo desplegar o ejecutar el activo.`
              : `Paso obligatorio antes de ver el activo en el resumen o publicar otro. Documenta cómo preparar, desplegar y ejecutar ${agenteNombre}; aparecerá en la guía de despliegue del marketplace.`}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pub-guia" className="block font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Instrucciones de despliegue y ejecución
        </label>
        <textarea
          id="pub-guia"
          rows={isOptional ? 6 : 10}
          required={!isOptional}
          minLength={isOptional ? undefined : 40}
          value={guiaDespliegue}
          disabled={isSaving}
          onChange={(event) => setGuiaDespliegue(event.target.value)}
          placeholder={`Describe paso a paso:\n· Requisitos previos (credenciales, red, dependencias)\n· Comandos o importación del flujo\n· Variables de entorno obligatorias\n· Comprobaciones post-despliegue y rollback`}
          className="w-full resize-y rounded-lg border border-neutral-800/80 bg-black px-3 py-3 font-mono text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
        />
        <p className="text-[11px] text-neutral-600">
          {isOptional
            ? "Si guardas cambios, mínimo 40 caracteres. Si no editas nada, se mantienen las instrucciones anteriores."
            : "Mínimo 40 caracteres. Sé explícito: un comprador debe poder operar el activo sin contactarte."}
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3 py-3">
        <input
          type="checkbox"
          checked={admiteAdaptacion}
          disabled={isSaving}
          onChange={(event) => setAdmiteAdaptacion(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/40"
        />
        <span className="text-sm leading-relaxed text-neutral-300">
          Este activo admite{" "}
          <strong className="font-medium text-neutral-100">
            servicios de adaptación
          </strong>{" "}
          (fine-tuning / personalización a medida solicitada por compradores).
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300/90"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSaving || guiaDespliegue.trim().length < 40}
        className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving
          ? "Guardando guía…"
          : isOptional
            ? "Actualizar guía en el marketplace"
            : "Guardar guía en el marketplace"}
      </button>
    </form>
  );
}
