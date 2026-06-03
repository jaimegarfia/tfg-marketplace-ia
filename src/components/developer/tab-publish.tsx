"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Box,
  CheckCircle2,
  Fingerprint,
  ScanLine,
  ShieldX,
  Workflow,
  XCircle,
} from "lucide-react";
import type { CategoriaAgente, TipoActivo } from "@/types/database";
import { CATEGORIAS_AGENTE, etiquetaCategoria } from "@/lib/catalog-format";
import { VerifiedPermissionsScope } from "@/components/verified-permissions-scope";
import {
  publishAssetAction,
  type PublishAssetActionInput,
} from "@/app/developer/dashboard/actions";
import type { PublishAssetResult } from "@/lib/developer-publish";

const DEFAULT_DESCRIPTOR = JSON.stringify(
  {
    workflow: {
      engine: "n8n",
      steps: [
        {
          id: "fetch-context",
          action: "fetch",
          endpoint: "https://api.example.com/context",
        },
        { id: "summarize", action: "llm.completion", model: "gpt-4o-mini" },
      ],
    },
  },
  null,
  2,
);

const CERTIFICATION_PHASES = [
  "Generando identificador único de activo...",
  "Instanciando jaula de aislamiento efímera en Docker (node:18-alpine)...",
  "Configurando políticas estrictas de red (egreso deshabilitado)...",
  "Ejecutando analizador estático contra patrones de vulnerabilidades...",
  "Generando huella criptográfica SHA-256 e insertando registros atómicos en Neon...",
] as const;

const PHASE_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const PIPELINE_STEPS = [
  {
    icon: Fingerprint,
    title: "Huella SHA-256",
    detail: "Se calcula el hash de integridad del descriptor enviado.",
  },
  {
    icon: Box,
    title: "Contenedor aislado",
    detail: "docker run --network none -m 128m · sin egreso ni acceso al host.",
  },
  {
    icon: ScanLine,
    title: "Análisis estático",
    detail: "Escaneo de patrones de filesystem, red y código dinámico.",
  },
  {
    icon: ShieldX,
    title: "Veredicto Zero Trust",
    detail: "0 señales de riesgo → certificado. Cualquier hallazgo → rechazado.",
  },
] as const;

const TIPO_OPTIONS: ReadonlyArray<{ value: TipoActivo; label: string }> = [
  { value: "runtime_artifact", label: "Artefacto ejecutable (contenedor)" },
  {
    value: "reference_architecture",
    label: "Arquitectura de referencia (workflow)",
  },
];

interface FormState {
  nombre: string;
  version: string;
  precioUsd: string;
  tipoActivo: TipoActivo;
  categoria: CategoriaAgente;
  descripcion: string;
  descriptorTecnico: string;
}

const INITIAL_FORM: FormState = {
  nombre: "",
  version: "1.0.0",
  precioUsd: "0",
  tipoActivo: "runtime_artifact",
  categoria: "automatizacion",
  descripcion: "",
  descriptorTecnico: DEFAULT_DESCRIPTOR,
};

const FIELD_CLASS =
  "w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50";
const LABEL_CLASS =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-neutral-500";

function CertificationOverlay({ phaseIndex }: { phaseIndex: number }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certification-overlay-title"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-xl border border-neutral-800/80 bg-neutral-950 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-neutral-700 border-t-emerald-400"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p
              id="certification-overlay-title"
              className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80"
            >
              Motor de certificación Zero Trust
            </p>
            <p
              key={phaseIndex}
              className="mt-2 animate-fade-up text-sm leading-relaxed text-neutral-200"
            >
              {CERTIFICATION_PHASES[phaseIndex]}
            </p>
          </div>
        </div>
        <div
          className="mt-5 flex gap-1.5"
          aria-label={`Fase ${phaseIndex + 1} de ${CERTIFICATION_PHASES.length}`}
        >
          {CERTIFICATION_PHASES.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                index <= phaseIndex ? "bg-emerald-500/80" : "bg-neutral-800"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityPipeline() {
  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/30 p-5">
      <div className="flex items-center gap-2">
        <Workflow
          size={15}
          strokeWidth={1.5}
          className="text-emerald-400/80"
          aria-hidden="true"
        />
        <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Pipeline de certificación Zero Trust
        </h3>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-800/80 bg-neutral-950/60 text-emerald-400/80">
                  <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] text-neutral-600">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-neutral-200">
                {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                {step.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditResultPanel({ result }: { result: PublishAssetResult }) {
  const certified = result.resultadoGlobal;

  return (
    <div className="space-y-4 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-5">
      <div className="flex items-start gap-3">
        {certified ? (
          <CheckCircle2
            size={20}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-emerald-400/90"
            aria-hidden="true"
          />
        ) : (
          <XCircle
            size={20}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-red-400/90"
            aria-hidden="true"
          />
        )}
        <div>
          <h3 className="text-base font-medium text-neutral-100">
            {certified
              ? "Activo certificado y publicado"
              : "Activo rechazado por el sandbox"}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {certified
              ? `${result.nombre} ya está disponible en el marketplace.`
              : "El motor detectó superficie de riesgo. Revisa los logs y reajusta el descriptor."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Veredicto
          </p>
          <p
            className={`mt-1 font-mono text-sm font-medium ${certified ? "text-emerald-300/90" : "text-red-300/90"}`}
          >
            {certified ? "PASS" : "FAIL"}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Vulnerabilidades
          </p>
          <p className="mt-1 font-mono text-sm text-neutral-200">
            {result.vulnerabilidadesDetectadas}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800/60 bg-[var(--surface)] px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Fecha auditoría
          </p>
          <p className="mt-1 text-xs text-neutral-300">
            {new Date(result.fechaEjecucion).toLocaleString("es-ES")}
          </p>
        </div>
      </div>

      <div>
        <VerifiedPermissionsScope permisos={result.permisosAprobados} embedded />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Hash de integridad
        </p>
        <p className="break-all rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3 py-2 font-mono text-[11px] text-neutral-400">
          SHA-256: {result.hashIntegridad}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Logs del sandbox
        </p>
        <pre className="max-h-72 overflow-auto rounded-lg border border-neutral-800/60 bg-neutral-900/50 p-4 font-mono text-[11px] leading-relaxed text-neutral-400">
          {result.logsSandbox}
        </pre>
      </div>
    </div>
  );
}

export function TabPublish({ onPublished }: { onPublished: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublishAssetResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const payload: PublishAssetActionInput = {
      nombre: form.nombre,
      version: form.version,
      precioUsd: Number(form.precioUsd),
      tipoActivo: form.tipoActivo,
      categoria: form.categoria,
      descripcion: form.descripcion,
      descriptorTecnico: form.descriptorTecnico,
    };

    setIsAuditing(true);
    setPhaseIndex(0);

    try {
      for (let index = 0; index < CERTIFICATION_PHASES.length; index += 1) {
        setPhaseIndex(index);
        await sleep(PHASE_MS);
      }

      const response = await publishAssetAction(payload);
      if (!response.ok) {
        setError(response.error);
        return;
      }

      setResult(response.result);
      setForm((prev) => ({
        ...INITIAL_FORM,
        descriptorTecnico: prev.descriptorTecnico,
      }));
      router.refresh();
      onPublished();
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {isAuditing && <CertificationOverlay phaseIndex={phaseIndex} />}

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
          Publicar nuevo activo
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Cada activo pasa por una auditoría automática en un contenedor aislado
          antes de aparecer en el marketplace.
        </p>
      </div>

      <SecurityPipeline />

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-neutral-800/80 bg-neutral-950/30 p-5 sm:p-6"
      >
        <div className="space-y-1.5">
          <label htmlFor="pub-nombre" className={LABEL_CLASS}>
            Nombre del activo
          </label>
          <input
            id="pub-nombre"
            value={form.nombre}
            disabled={isAuditing}
            onChange={(event) => setField("nombre", event.target.value)}
            placeholder="Ej. Sentinel Runtime Guard"
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pub-desc" className={LABEL_CLASS}>
            Descripción comercial
          </label>
          <textarea
            id="pub-desc"
            rows={2}
            value={form.descripcion}
            disabled={isAuditing}
            onChange={(event) => setField("descripcion", event.target.value)}
            placeholder="Qué hace el agente y para qué casos de uso está pensado."
            className={`${FIELD_CLASS} resize-y`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label htmlFor="pub-version" className={LABEL_CLASS}>
              Versión
            </label>
            <input
              id="pub-version"
              value={form.version}
              disabled={isAuditing}
              onChange={(event) => setField("version", event.target.value)}
              placeholder="1.0.0"
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pub-precio" className={LABEL_CLASS}>
              Precio (USD)
            </label>
            <input
              id="pub-precio"
              type="number"
              min={0}
              step="1"
              value={form.precioUsd}
              disabled={isAuditing}
              onChange={(event) => setField("precioUsd", event.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pub-tipo" className={LABEL_CLASS}>
              Tipo de activo
            </label>
            <select
              id="pub-tipo"
              value={form.tipoActivo}
              disabled={isAuditing}
              onChange={(event) =>
                setField("tipoActivo", event.target.value as TipoActivo)
              }
              className={FIELD_CLASS}
            >
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pub-categoria" className={LABEL_CLASS}>
              Categoría
            </label>
            <select
              id="pub-categoria"
              value={form.categoria}
              disabled={isAuditing}
              onChange={(event) =>
                setField("categoria", event.target.value as CategoriaAgente)
              }
              className={FIELD_CLASS}
            >
              {CATEGORIAS_AGENTE.map((cat) => (
                <option key={cat} value={cat}>
                  {etiquetaCategoria(cat)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pub-descriptor" className={LABEL_CLASS}>
            Descriptor técnico (JSON del flujo)
          </label>
          <textarea
            id="pub-descriptor"
            rows={12}
            spellCheck={false}
            value={form.descriptorTecnico}
            disabled={isAuditing}
            onChange={(event) =>
              setField("descriptorTecnico", event.target.value)
            }
            className={`${FIELD_CLASS} font-mono text-xs`}
          />
          <p className="text-[11px] leading-relaxed text-neutral-600">
            El sandbox analiza este JSON: declarar acceso a red, filesystem o
            código dinámico aumenta la superficie de riesgo y puede provocar el
            rechazo del activo.
          </p>
        </div>

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
          disabled={isAuditing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isAuditing ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-900"
                aria-hidden="true"
              />
              Auditando en contenedor aislado...
            </>
          ) : (
            <>
              <ScanLine size={15} strokeWidth={1.5} aria-hidden="true" />
              Enviar a auditoría y publicar
            </>
          )}
        </button>
      </form>

      {result && <AuditResultPanel result={result} />}
    </div>
  );
}
