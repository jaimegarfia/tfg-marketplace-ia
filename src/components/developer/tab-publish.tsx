"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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
import {
  DEFAULT_ASSET_VISUAL_ICON,
  type AssetVisualIconId,
} from "@/lib/asset-visual-icons";
import { AssetVisualIconPicker } from "@/components/developer/asset-visual-icon-picker";
import { CATEGORIAS_AGENTE, etiquetaCategoria } from "@/lib/catalog-format";
import { validatePublishConfig } from "@/lib/publish-descriptor";
import {
  extractSandboxFailureReasons,
  getInfrastructureFailureHint,
} from "@/lib/sandbox-log-parse";
import { VerifiedPermissionsScope } from "@/components/verified-permissions-scope";
import {
  publishAssetAction,
  type PublishAssetActionInput,
} from "@/app/developer/dashboard/actions";
import type { PublishAssetResult } from "@/lib/developer-publish";
import {
  CertificationProgressCard,
  runCertificationPhasesDuring,
} from "@/components/developer/certification-overlay";
import {
  PublishSuccessActions,
  PublishSuccessPanel,
} from "@/components/developer/publish-success-panel";
import { PublishConfigByTipo } from "@/components/developer/publish-config-fields";
import { PostAuditCatalogPanel } from "@/components/developer/post-audit-catalog-panel";

const DEFAULT_FLOW_DESCRIPTOR = JSON.stringify(
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

const DEFAULT_MANIFEST_JSON = JSON.stringify(
  {
    env: {
      CERTIA_AGENT_ID: "",
      LOG_LEVEL: "info",
    },
    resources: {
      memory: "128m",
      cpus: "0.5",
    },
  },
  null,
  2,
);

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
    label: "Arquitectura de referencia (automatización / workflow)",
  },
];

type TipoSeleccion = TipoActivo | "";

interface FormState {
  tipoActivo: TipoSeleccion;
  nombre: string;
  version: string;
  precioEur: string;
  categoria: CategoriaAgente;
  imagenUrl: AssetVisualIconId;
  estudioComercial: string;
  descripcion: string;
  flowDescriptor: string;
  imageRegistryUri: string;
  manifestJson: string;
  admiteAdaptacion: boolean;
}

const INITIAL_FORM: FormState = {
  tipoActivo: "",
  nombre: "",
  version: "1.0.0",
  precioEur: "0",
  categoria: "automatizacion",
  imagenUrl: DEFAULT_ASSET_VISUAL_ICON,
  estudioComercial: "",
  descripcion: "",
  flowDescriptor: DEFAULT_FLOW_DESCRIPTOR,
  imageRegistryUri: "",
  manifestJson: DEFAULT_MANIFEST_JSON,
  admiteAdaptacion: false,
};

const FIELD_CLASS =
  "w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50";
const LABEL_CLASS =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-neutral-500";

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

function AuditResultPanel({
  result,
  onRetry,
}: {
  result: PublishAssetResult;
  onRetry?: () => void;
}) {
  const certified = result.resultadoGlobal;
  const infrastructureFailure = result.failureKind === "infrastructure";
  const failureReasons = certified
    ? []
    : extractSandboxFailureReasons(result.logsSandbox);
  const infraHint = infrastructureFailure
    ? getInfrastructureFailureHint(result.logsSandbox)
    : null;

  return (
    <div
      className={`space-y-4 rounded-xl border p-5 ${
        certified
          ? "border-neutral-800/80 bg-neutral-950/40"
          : "border-red-500/25 bg-red-500/[0.04]"
      }`}
    >
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
              : infrastructureFailure
                ? "No se pudo ejecutar la auditoría"
                : "Activo rechazado por el sandbox"}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {certified
              ? `${result.nombre} ya está disponible en el marketplace.`
              : infrastructureFailure
                ? "El fallo es del entorno (Docker/sandbox), no de tu descriptor. Tu activo no se ha guardado en el catálogo."
                : "Corrige el descriptor o la configuración técnica abajo y vuelve a enviar. El activo no se ha añadido al catálogo."}
          </p>
        </div>
      </div>

      {!certified && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-red-400/80">
            {infrastructureFailure ? "Qué ha ocurrido" : "Por qué ha fallado"}
          </p>
          {infraHint && (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm leading-relaxed text-amber-100/90">
              {infraHint}
            </p>
          )}
          {failureReasons.length > 0 && (
            <ul className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-3 text-sm leading-relaxed text-red-200/90">
              {failureReasons.map((reason) => (
                <li key={reason} className="list-disc pl-4 marker:text-red-400/60">
                  {reason}
                </li>
              ))}
            </ul>
          )}
          {!infraHint && failureReasons.length === 0 && (
            <p className="text-sm text-neutral-400">
              El sandbox detectó riesgo en el descriptor. Revisa los logs
              completos para localizar permisos de red, filesystem o scripts
              dinámicos no permitidos.
            </p>
          )}
          {onRetry && !infrastructureFailure && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-neutral-500 hover:bg-neutral-800"
            >
              Corregir descriptor y reintentar
            </button>
          )}
          {infrastructureFailure && (
            <p className="text-xs text-neutral-600">
              Tras arrancar Docker (y construir la imagen si hace falta), pulsa
              de nuevo «Enviar a auditoría y publicar» sin cambiar el descriptor.
            </p>
          )}
        </div>
      )}

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
            {infrastructureFailure && !certified
              ? "—"
              : result.vulnerabilidadesDetectadas}
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

      {certified && result.permisosAprobados && (
        <div>
          <VerifiedPermissionsScope
            permisos={result.permisosAprobados}
            embedded
          />
        </div>
      )}

      {!certified && !infrastructureFailure && result.permisosAprobados && (
        <div>
          <VerifiedPermissionsScope
            permisos={result.permisosAprobados}
            embedded
          />
        </div>
      )}

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
        <pre
          className={`max-h-80 overflow-auto rounded-lg border p-4 font-mono text-[11px] leading-relaxed ${
            certified
              ? "border-neutral-800/60 bg-neutral-900/50 text-neutral-400"
              : "border-red-500/20 bg-neutral-950 text-neutral-300"
          }`}
        >
          {result.logsSandbox}
        </pre>
      </div>
    </div>
  );
}

function PublishToast({
  message,
  variant,
}: {
  message: string;
  variant: "error" | "success";
}) {
  return (
    <p
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm ${
        variant === "error"
          ? "border-red-400/25 bg-red-400/10 text-red-300/90"
          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300/90"
      }`}
    >
      {message}
    </p>
  );
}

interface TabPublishProps {
  onPublished: () => void;
  defaultEstudioComercial?: string | null;
}

export function TabPublish({
  onPublished,
  defaultEstudioComercial = "",
}: TabPublishProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_FORM,
    estudioComercial: defaultEstudioComercial?.trim() ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "error" | "success";
  } | null>(null);
  const [result, setResult] = useState<PublishAssetResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const auditResultRef = useRef<HTMLDivElement>(null);
  const successResultRef = useRef<HTMLDivElement>(null);
  const technicalConfigRef = useRef<HTMLDivElement>(null);
  const [savedAdmiteAdaptacion, setSavedAdmiteAdaptacion] = useState(false);
  const [deploymentGuideSaved, setDeploymentGuideSaved] = useState(false);

  const scrollToTechnicalConfig = useCallback(() => {
    technicalConfigRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  useEffect(() => {
    if (!result) return;
    const target = result.resultadoGlobal
      ? successResultRef.current
      : auditResultRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const showSyntaxToast = useCallback((message: string) => {
    setToast({ message, variant: "error" });
  }, []);

  const clearSyntaxToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setToast(null);
    setResult(null);

    if (!form.tipoActivo) {
      setError("Selecciona primero el tipo de activo para continuar.");
      return;
    }

    const configCheck = validatePublishConfig({
      tipoActivo: form.tipoActivo,
      flowDescriptor: form.flowDescriptor,
      imageRegistryUri: form.imageRegistryUri,
      manifestJson: form.manifestJson,
    });

    if (!configCheck.ok) {
      setError(configCheck.error);
      return;
    }

    const payload: PublishAssetActionInput = {
      nombre: form.nombre,
      version: form.version,
      precioEur: Number(form.precioEur),
      tipoActivo: form.tipoActivo,
      categoria: form.categoria,
      descripcion: form.descripcion,
      descriptorTecnico: configCheck.descriptorTecnico,
      imagenUrl: form.imagenUrl,
      estudioComercial: form.estudioComercial.trim() || null,
      admiteAdaptacion: form.admiteAdaptacion,
    };

    setIsAuditing(true);
    setPhaseIndex(0);

    try {
      let response:
        | { ok: true; result: PublishAssetResult }
        | { ok: false; error: string }
        | undefined;

      await runCertificationPhasesDuring(setPhaseIndex, async () => {
        response = await publishAssetAction(payload);
      });

      if (!response) {
        setError("No se recibió respuesta del servidor de publicación.");
        return;
      }

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setResult(response.result);

      if (response.result.resultadoGlobal) {
        setSavedAdmiteAdaptacion(form.admiteAdaptacion);
        setDeploymentGuideSaved(false);
        router.refresh();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Error inesperado durante la auditoría.",
      );
    } finally {
      setIsAuditing(false);
    }
  };

  const tipoResolved = form.tipoActivo !== "";
  const publishSucceeded = result?.resultadoGlobal === true;

  const handlePublishAnother = () => {
    setResult(null);
    setSavedAdmiteAdaptacion(false);
    setDeploymentGuideSaved(false);
    setForm({
      ...INITIAL_FORM,
      estudioComercial: defaultEstudioComercial?.trim() ?? "",
    });
    setError(null);
    setToast(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-100">
          Publicar nuevo activo
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Elige el tipo de activo para configurar el flujo o el contenedor; cada
          publicación pasa por auditoría automática en sandbox aislado.
        </p>
      </div>

      <SecurityPipeline />

      {publishSucceeded && result && (
        <div ref={successResultRef} className="space-y-5">
          <PublishSuccessPanel result={result} />
          {result.agenteId ? (
            <PostAuditCatalogPanel
              agenteId={result.agenteId}
              agenteNombre={result.nombre}
              initialAdmiteAdaptacion={savedAdmiteAdaptacion}
              onSaved={() => {
                setDeploymentGuideSaved(true);
                router.refresh();
              }}
            />
          ) : null}
          {deploymentGuideSaved ? (
            <PublishSuccessActions
              onViewSummary={onPublished}
              onPublishAnother={handlePublishAnother}
            />
          ) : (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-100/90">
              Guarda las instrucciones de despliegue (mín. 40 caracteres) para
              poder ver el activo en el resumen o publicar otro.
            </p>
          )}
        </div>
      )}

      {!publishSucceeded && (
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-neutral-800/80 bg-neutral-950/30 p-5 sm:p-6"
      >
        {isAuditing && (
          <CertificationProgressCard phaseIndex={phaseIndex} />
        )}

        <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-4">
          <label htmlFor="pub-tipo" className={LABEL_CLASS}>
            Tipo de activo
          </label>
          <select
            id="pub-tipo"
            value={form.tipoActivo}
            disabled={isAuditing}
            onChange={(event) => {
              const value = event.target.value as TipoSeleccion;
              setField("tipoActivo", value);
              setToast(null);
            }}
            className={`${FIELD_CLASS} text-base`}
          >
            <option value="" disabled>
              Selecciona cómo vas a publicar el activo…
            </option>
            {TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-neutral-600">
            {form.tipoActivo === "reference_architecture"
              ? "Automatización: carga un flujo declarativo (.json / .yaml) y edítalo en el IDE integrado."
              : form.tipoActivo === "runtime_artifact"
                ? "Contenedor: indica la URI del registro y el manifiesto JSON del runtime."
                : "Este paso define qué bloque de configuración verás a continuación."}
          </p>
        </div>

        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Identidad del activo
          </p>
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
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 sm:max-w-xs">
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

          <AssetVisualIconPicker
            value={form.imagenUrl}
            onChange={(iconId) => setField("imagenUrl", iconId)}
            disabled={isAuditing}
          />
        </div>

        <div ref={technicalConfigRef}>
        {tipoResolved ? (
          <PublishConfigByTipo
            tipoActivo={form.tipoActivo as TipoActivo}
            flowDescriptor={form.flowDescriptor}
            onFlowDescriptorChange={(value) => setField("flowDescriptor", value)}
            imageRegistryUri={form.imageRegistryUri}
            onImageRegistryUriChange={(value) =>
              setField("imageRegistryUri", value)
            }
            manifestJson={form.manifestJson}
            onManifestJsonChange={(value) => setField("manifestJson", value)}
            disabled={isAuditing}
            onSyntaxError={showSyntaxToast}
            onClearSyntaxError={clearSyntaxToast}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-800/80 px-4 py-6 text-center text-sm text-neutral-600">
            Selecciona un tipo de activo arriba para mostrar la configuración
            técnica.
          </p>
        )}
        </div>

        {result && !result.resultadoGlobal && (
          <div ref={auditResultRef}>
            <AuditResultPanel
              result={result}
              onRetry={() => {
                setResult(null);
                scrollToTechnicalConfig();
              }}
            />
          </div>
        )}

        {toast && (
          <PublishToast message={toast.message} variant={toast.variant} />
        )}

        <div className="border-t border-neutral-800/60 pt-5">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Metadatos del catálogo
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="pub-estudio" className={LABEL_CLASS}>
                Nombre del estudio / firma comercial
              </label>
              <input
                id="pub-estudio"
                value={form.estudioComercial}
                disabled={isAuditing}
                onChange={(event) =>
                  setField("estudioComercial", event.target.value)
                }
                placeholder='Ej. "JG Labs" o "Certia Studio"'
                className={FIELD_CLASS}
              />
              <p className="text-[11px] text-neutral-600">
                Aparece en la tarjeta del marketplace como «por [estudio]». Si lo
                dejas vacío, se usará el nombre de tu cuenta.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3 py-3">
              <input
                type="checkbox"
                checked={form.admiteAdaptacion}
                disabled={isAuditing}
                onChange={(event) =>
                  setField("admiteAdaptacion", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-emerald-500 focus:ring-emerald-500/40"
              />
              <span className="text-sm leading-relaxed text-neutral-400">
                Ofrecer{" "}
                <strong className="font-medium text-neutral-200">
                  servicios de adaptación
                </strong>{" "}
                para este activo (visible en todo el marketplace).
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  Precio (EUR)
                </label>
                <input
                  id="pub-precio"
                  type="number"
                  min={0}
                  step="1"
                  value={form.precioEur}
                  disabled={isAuditing}
                  onChange={(event) => setField("precioEur", event.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>
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
          disabled={isAuditing || !tipoResolved}
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
      )}
    </div>
  );
}
