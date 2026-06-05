"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { History, PlusCircle, ScanLine } from "lucide-react";
import type { DeveloperAssetDetail } from "@/lib/developer-asset";
import type { SubmitVersionResult } from "@/lib/developer-asset";
import type { PublishAssetResult } from "@/lib/developer-publish";
import { etiquetaTipoActivo } from "@/lib/catalog-format";
import {
  parseStoredDescriptorToFields,
  validatePublishConfig,
} from "@/lib/publish-descriptor";
import { validateVersionIncrement } from "@/lib/version-utils";
import { submitAssetVersionAction } from "@/app/developer/dashboard/actions";
import {
  CertificationProgressCard,
  runCertificationPhasesDuring,
} from "@/components/developer/certification-overlay";
import { PublishConfigByTipo } from "@/components/developer/publish-config-fields";
import { PostAuditCatalogPanel } from "@/components/developer/post-audit-catalog-panel";
import { PublishAuditResultPanel } from "@/components/developer/publish-audit-result-panel";
import {
  PublishSuccessPanel,
  VersionSuccessActions,
} from "@/components/developer/publish-success-panel";
import { SecurityPipeline } from "@/components/developer/security-pipeline";

const FIELD_CLASS =
  "w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50";
const LABEL_CLASS =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-neutral-500";

function bumpVersion(current: string): string {
  const parts = current.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length === 3) {
    const [major, minor, patch] = parts;
    if (
      major !== undefined &&
      minor !== undefined &&
      patch !== undefined &&
      Number.isFinite(major) &&
      Number.isFinite(minor) &&
      Number.isFinite(patch)
    ) {
      return `${major}.${minor}.${patch + 1}`;
    }
  }
  return current;
}

function toPublishAssetResult(
  detail: DeveloperAssetDetail,
  result: SubmitVersionResult,
): PublishAssetResult {
  return {
    agenteId: detail.id,
    nombre: detail.nombre,
    estadoAuditoria: result.estadoAuditoria,
    resultadoGlobal: result.resultadoGlobal,
    hashIntegridad: result.hashIntegridad,
    vulnerabilidadesDetectadas: result.vulnerabilidadesDetectadas,
    logsSandbox: result.logsSandbox,
    permisosAprobados: result.permisosAprobados,
    fechaEjecucion: result.fechaEjecucion,
    failureKind: result.failureKind,
  };
}

interface AssetVersionTabProps {
  detail: DeveloperAssetDetail;
  onCompleted: () => void;
  onViewHistory: () => void;
}

export function AssetVersionTab({
  detail,
  onCompleted,
  onViewHistory,
}: AssetVersionTabProps) {
  const parsed = parseStoredDescriptorToFields(
    detail.tipo_activo,
    detail.descriptor_tecnico,
  );

  const [newVersion, setNewVersion] = useState(() => bumpVersion(detail.version));
  const [flowDescriptor, setFlowDescriptor] = useState(parsed.flowDescriptor);
  const [imageRegistryUri, setImageRegistryUri] = useState(
    parsed.imageRegistryUri,
  );
  const [manifestJson, setManifestJson] = useState(parsed.manifestJson);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<SubmitVersionResult | null>(
    null,
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const auditResultRef = useRef<HTMLDivElement>(null);
  const successResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fields = parseStoredDescriptorToFields(
      detail.tipo_activo,
      detail.descriptor_tecnico,
    );
    setNewVersion(bumpVersion(detail.version));
    setFlowDescriptor(fields.flowDescriptor);
    setImageRegistryUri(fields.imageRegistryUri);
    setManifestJson(fields.manifestJson);
  }, [
    detail.id,
    detail.version,
    detail.tipo_activo,
    detail.descriptor_tecnico,
  ]);

  const handleNewUpdate = useCallback(async () => {
    setAuditResult(null);
    setError(null);
    setToast(null);
    await onCompleted();
  }, [onCompleted]);

  useEffect(() => {
    if (!auditResult) return;
    const target = auditResult.resultadoGlobal
      ? successResultRef.current
      : auditResultRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [auditResult]);

  const versionSucceeded = auditResult?.resultadoGlobal === true;
  const publishResult =
    auditResult && versionSucceeded
      ? toPublishAssetResult(detail, auditResult)
      : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setToast(null);
    setAuditResult(null);

    const versionCheck = validateVersionIncrement(detail.version, newVersion);
    if (!versionCheck.ok) {
      setError(versionCheck.error);
      return;
    }

    const configCheck = validatePublishConfig({
      tipoActivo: detail.tipo_activo,
      flowDescriptor,
      imageRegistryUri,
      manifestJson,
    });

    if (!configCheck.ok) {
      setError(configCheck.error);
      return;
    }

    setIsAuditing(true);
    setPhaseIndex(0);

    try {
      let response:
        | Awaited<ReturnType<typeof submitAssetVersionAction>>
        | undefined;

      await runCertificationPhasesDuring(setPhaseIndex, async () => {
        response = await submitAssetVersionAction(detail.id, {
          version: newVersion,
          descriptorTecnico: configCheck.descriptorTecnico,
        });
      });

      if (!response) {
        setError("No se recibió respuesta al certificar la versión.");
        return;
      }

      if (!response.ok) {
        setError(response.error);
        return;
      }

      setAuditResult(response.result);
      onCompleted();
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

  if (versionSucceeded && publishResult) {
    return (
      <div className="space-y-5">
        <div ref={successResultRef}>
          <PublishSuccessPanel
            result={publishResult}
            title="Versión certificada con éxito"
            description={`${detail.nombre} v${newVersion} ha superado la auditoría. Revisa los logs y, si hace falta, actualiza la guía de despliegue.`}
          />
        </div>
        <PostAuditCatalogPanel
          agenteId={detail.id}
          agenteNombre={detail.nombre}
          initialAdmiteAdaptacion={detail.admite_adaptacion}
          initialGuiaDespliegue={detail.guia_despliegue ?? ""}
          mode="optional"
          onSaved={onCompleted}
        />
        <VersionSuccessActions
          onViewHistory={onViewHistory}
          onNewUpdate={() => void handleNewUpdate()}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm leading-relaxed text-neutral-500">
        Mismo flujo que al publicar un activo nuevo: configura la versión y la
        parte técnica según el tipo ({etiquetaTipoActivo(detail.tipo_activo)}).
        La guía de despliegue se conserva; podrás editarla tras certificar si lo
        necesitas.
      </p>

      <SecurityPipeline compact />

      {isAuditing && <CertificationProgressCard phaseIndex={phaseIndex} />}

      <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3 py-2.5 text-sm text-neutral-400">
        Versión actual:{" "}
        <span className="font-mono text-neutral-200">v{detail.version}</span>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="asset-ver" className={LABEL_CLASS}>
          Nueva versión
        </label>
        <input
          id="asset-ver"
          value={newVersion}
          disabled={isAuditing}
          onChange={(e) => setNewVersion(e.target.value)}
          placeholder="1.1.0"
          className={FIELD_CLASS}
        />
        <p className="mt-1 text-[11px] text-neutral-600">
          Debe ser superior a v{detail.version} (no se permiten versiones
          inferiores ni repetidas).
        </p>
      </div>

      <PublishConfigByTipo
        tipoActivo={detail.tipo_activo}
        flowDescriptor={flowDescriptor}
        onFlowDescriptorChange={setFlowDescriptor}
        imageRegistryUri={imageRegistryUri}
        onImageRegistryUriChange={setImageRegistryUri}
        manifestJson={manifestJson}
        onManifestJsonChange={setManifestJson}
        disabled={isAuditing}
        onSyntaxError={(message) => setToast(message)}
        onClearSyntaxError={() => setToast(null)}
      />

      {auditResult && !auditResult.resultadoGlobal && (
        <div ref={auditResultRef}>
          <PublishAuditResultPanel
            result={{
              nombre: detail.nombre,
              resultadoGlobal: auditResult.resultadoGlobal,
              failureKind: auditResult.failureKind,
              vulnerabilidadesDetectadas: auditResult.vulnerabilidadesDetectadas,
              fechaEjecucion: auditResult.fechaEjecucion,
              hashIntegridad: auditResult.hashIntegridad,
              logsSandbox: auditResult.logsSandbox,
              permisosAprobados: auditResult.permisosAprobados,
            }}
            onRetry={() => setAuditResult(null)}
            rejectDescription="Corrige la configuración técnica y vuelve a enviar. La versión publicada anterior no ha cambiado."
          />
        </div>
      )}

      {toast && (
        <p
          role="status"
          className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-sm text-red-300/90"
        >
          {toast}
        </p>
      )}

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
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAuditing ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-900"
              aria-hidden="true"
            />
            Auditando...
          </>
        ) : (
          <>
            <ScanLine size={15} strokeWidth={1.5} aria-hidden="true" />
            Enviar a auditoría y actualizar
          </>
        )}
      </button>
    </form>
  );
}
