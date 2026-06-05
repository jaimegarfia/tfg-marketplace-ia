"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { History, MessageSquare, PencilLine, Star, X } from "lucide-react";
import type { DeveloperAssetDetail } from "@/lib/developer-asset";
import type { CategoriaAgente } from "@/types/database";
import {
  CATEGORIAS_AGENTE,
  etiquetaCategoria,
  etiquetaTipoActivo,
  formatearPrecio,
  formatearRating,
} from "@/lib/catalog-format";
import { AuditBadge } from "@/components/audit-badge";
import { AssetVisualThumbnail } from "@/components/developer/asset-visual-thumbnail";
import {
  deleteAssetAction,
  getAssetDetailAction,
  updateAssetAction,
} from "@/app/developer/dashboard/actions";
import { AssetDeleteConfirmModal } from "@/components/developer/asset-delete-confirm-modal";
import { AssetVersionTab } from "@/components/developer/asset-version-tab";

type ManageTab = "ficha" | "version" | "valoraciones" | "auditorias";

const MANAGE_TABS: ReadonlyArray<{ id: ManageTab; label: string }> = [
  { id: "ficha", label: "Ficha del activo" },
  { id: "version", label: "Nueva versión" },
  { id: "valoraciones", label: "Valoraciones" },
  { id: "auditorias", label: "Historial" },
];

const FIELD_CLASS =
  "w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50";
const LABEL_CLASS =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-neutral-500";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={1.25}
          className={
            i < Math.round(value)
              ? "fill-amber-400/80 text-amber-400/80"
              : "text-neutral-700"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface AssetManageDrawerProps {
  agenteId: string;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted?: () => void;
}

export function AssetManageDrawer({
  agenteId,
  onClose,
  onUpdated,
  onDeleted,
}: AssetManageDrawerProps) {
  const [activeTab, setActiveTab] = useState<ManageTab>("ficha");
  const [detail, setDetail] = useState<DeveloperAssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [descripcion, setDescripcion] = useState("");
  const [precioEur, setPrecioEur] = useState("0");
  const [categoria, setCategoria] = useState<CategoriaAgente>("automatizacion");
  const [imagenUrl, setImagenUrl] = useState("");

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAssetDetailAction(agenteId);
    if (!result.ok) {
      setError(result.error);
      setDetail(null);
      setLoading(false);
      return;
    }
    const data = result.detail;
    setDetail(data);
    setDescripcion(data.descripcion);
    setPrecioEur(String(data.precio_eur));
    setCategoria(data.categoria);
    setImagenUrl(data.imagen_url ?? "");
    setLoading(false);
  }, [agenteId]);

  useEffect(() => {
    setMounted(true);
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const result = await updateAssetAction(agenteId, {
      descripcion,
      precioEur: Number(precioEur),
      categoria,
      imagenUrl: imagenUrl.trim() || null,
    });

    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess("Cambios guardados correctamente.");
    await loadDetail();
    onUpdated();
  };

  const handleDeleteConfirm = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteAssetAction(agenteId);
    if (!result.ok) {
      setDeleteError(result.error);
      setIsDeleting(false);
      return;
    }
    setDeleteModalOpen(false);
    onDeleted?.();
  };

  if (!mounted) {
    return null;
  }

  const panel = (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex justify-end"
      style={{ top: "7.25rem" }}
    >
      <div
        className="absolute inset-0 bg-black/55 animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={detail ? `Gestionar ${detail.nombre}` : "Gestionar activo"}
        className={`
          relative z-10 flex h-full w-full flex-col
          border-l border-neutral-800/80 bg-[#0b0d10] shadow-2xl shadow-black/60
          animate-slide-in-right
          ${activeTab === "version" ? "max-w-3xl" : "max-w-xl"}
        `}
      >

        <div className="relative border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900/40 to-transparent px-5 py-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/[0.05] hover:text-neutral-200"
          >
            <X size={16} strokeWidth={1.25} />
          </button>

          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Gestión de activo
          </p>

          {loading ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-neutral-800/80" />
              <div className="space-y-2">
                <div className="h-5 w-44 animate-pulse rounded bg-neutral-800/80" />
                <div className="h-3 w-28 animate-pulse rounded bg-neutral-800/60" />
              </div>
            </div>
          ) : (
            detail && (
              <div className="mt-3 flex items-start gap-3.5 pr-8">
                <AssetVisualThumbnail
                  imagenUrl={detail.imagen_url}
                  categoria={detail.categoria}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-neutral-50">
                    {detail.nombre}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="font-mono text-neutral-400">
                      v{detail.version}
                    </span>
                    <span className="text-neutral-700">·</span>
                    <span>{etiquetaTipoActivo(detail.tipo_activo)}</span>
                    <span className="text-neutral-700">·</span>
                    <span>{etiquetaCategoria(detail.categoria)}</span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <AuditBadge estado={detail.estado_auditoria} />
                    <span className="text-sm font-semibold text-neutral-100">
                      {formatearPrecio(detail.precio_eur)}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {detail && !loading && (
          <div className="grid grid-cols-3 divide-x divide-neutral-800/60 border-b border-neutral-800/80 bg-neutral-950/40">
            <div className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                Ventas
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-100">
                {detail.ventas_count}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                Ingresos
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-emerald-300/90">
                {formatearPrecio(detail.ingresos_eur)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">
                Valoración
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-neutral-100">
                {detail.num_valoraciones > 0 ? (
                  <>
                    <Star
                      size={13}
                      className="fill-amber-400/80 text-amber-400/80"
                      aria-hidden="true"
                    />
                    <span className="tabular-nums">
                      {formatearRating(detail.rating_promedio)}
                    </span>
                    <span className="text-xs font-normal text-neutral-500">
                      ({detail.num_valoraciones})
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-normal text-neutral-500">—</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div
          role="tablist"
          aria-label="Secciones de gestión"
          className="flex gap-1 overflow-x-auto border-b border-neutral-800/80 bg-neutral-950/30 px-4 py-2 sm:px-5"
        >
          {MANAGE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className={`drawer-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6 ${
            activeTab === "auditorias" ? "flex flex-col min-h-0" : ""
          }`}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <span
                className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-emerald-400"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm text-neutral-500">Cargando activo...</p>
            </div>
          )}

          {!loading && error && !detail && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300/90"
            >
              {error}
            </p>
          )}

          {!loading && detail && (
            <>
              {error && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300/90"
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  role="status"
                  className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300/90"
                >
                  {success}
                </p>
              )}

              {activeTab === "ficha" && (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                      Identificador
                    </p>
                    <p className="mt-1 text-sm text-neutral-300">{detail.nombre}</p>
                    <p className="mt-1 font-mono text-[10px] text-neutral-600">
                      {detail.id}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="asset-desc" className={LABEL_CLASS}>
                      Descripción comercial
                    </label>
                    <textarea
                      id="asset-desc"
                      rows={4}
                      value={descripcion}
                      disabled={isSaving}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className={`${FIELD_CLASS} resize-y`}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="asset-precio" className={LABEL_CLASS}>
                        Precio (EUR)
                      </label>
                      <input
                        id="asset-precio"
                        type="number"
                        min={0}
                        step="1"
                        value={precioEur}
                        disabled={isSaving}
                        onChange={(e) => setPrecioEur(e.target.value)}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="asset-cat" className={LABEL_CLASS}>
                        Categoría
                      </label>
                      <select
                        id="asset-cat"
                        value={categoria}
                        disabled={isSaving}
                        onChange={(e) =>
                          setCategoria(e.target.value as CategoriaAgente)
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

                  <div>
                    <label htmlFor="asset-img" className={LABEL_CLASS}>
                      URL de imagen (opcional)
                    </label>
                    <input
                      id="asset-img"
                      type="url"
                      value={imagenUrl}
                      disabled={isSaving}
                      onChange={(e) => setImagenUrl(e.target.value)}
                      placeholder="https://..."
                      className={FIELD_CLASS}
                    />
                  </div>

                  {detail.hash_integridad && (
                    <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                        Hash SHA-256
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] text-neutral-500">
                        {detail.hash_integridad}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:opacity-60"
                  >
                    <PencilLine size={14} strokeWidth={1.5} aria-hidden="true" />
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </button>

                  <div className="mt-10 border-t border-neutral-800/60 pt-6">
                    {detail.ventas_count > 0 ? (
                      <p className="text-xs leading-relaxed text-neutral-500">
                        Este activo no puede eliminarse porque tiene ventas o
                        solicitudes de adaptación asociadas.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-neutral-500">
                          Retira el activo del catálogo y del marketplace.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteModalOpen(true);
                          }}
                          className="shrink-0 self-start rounded-lg border border-neutral-800/80 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-neutral-700 hover:bg-neutral-900/50 hover:text-neutral-200 sm:self-auto"
                        >
                          Eliminar activo
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {activeTab === "version" && (
                <AssetVersionTab
                  key={`${detail.id}-${detail.version}-${detail.hash_integridad ?? ""}`}
                  detail={detail}
                  onCompleted={async () => {
                    await loadDetail();
                    onUpdated();
                  }}
                  onViewHistory={() => setActiveTab("auditorias")}
                />
              )}

              {activeTab === "valoraciones" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-[var(--surface)] p-4">
                    <div>
                      <p className="text-2xl font-semibold tabular-nums text-neutral-100">
                        {detail.num_valoraciones > 0
                          ? formatearRating(detail.rating_promedio)
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {detail.num_valoraciones} valoraciones en el marketplace
                      </p>
                    </div>
                    {detail.num_valoraciones > 0 && (
                      <StarRating value={detail.rating_promedio} />
                    )}
                  </div>

                  {detail.valoraciones.length === 0 ? (
                    <div className="flex flex-col items-center rounded-xl border border-neutral-800/80 bg-neutral-950/30 py-12 text-center">
                      <MessageSquare
                        size={22}
                        className="text-neutral-600"
                        aria-hidden="true"
                      />
                      <p className="mt-3 text-sm text-neutral-400">
                        Aún no hay valoraciones para este activo.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {detail.valoraciones.map((review) => (
                        <li
                          key={review.id}
                          className="rounded-xl border border-neutral-800/80 bg-[var(--surface)] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-neutral-200">
                                {review.usuario_nombre}
                              </p>
                              {review.empresa_nombre && (
                                <p className="text-xs text-neutral-500">
                                  {review.empresa_nombre}
                                </p>
                              )}
                            </div>
                            <StarRating value={review.puntuacion} />
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                            {review.comentario}
                          </p>
                          <p className="mt-2 text-[10px] text-neutral-600">
                            {formatDate(review.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === "auditorias" && (
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  {detail.auditHistory.length === 0 ? (
                    <div className="flex flex-col items-center rounded-xl border border-neutral-800/80 bg-neutral-950/30 py-12 text-center">
                      <History
                        size={22}
                        className="text-neutral-600"
                        aria-hidden="true"
                      />
                      <p className="mt-3 text-sm text-neutral-400">
                        Sin ejecuciones de auditoría registradas.
                      </p>
                    </div>
                  ) : (
                    detail.auditHistory.map((audit, index) => (
                      <div
                        key={audit.id}
                        className={`flex flex-col rounded-xl border border-neutral-800/80 bg-[var(--surface)] p-4 ${
                          index === 0 ? "min-h-0 flex-1" : ""
                        }`}
                      >
                        <div className="flex shrink-0 items-center justify-between gap-2">
                          <span
                            className={`font-mono text-xs font-medium ${
                              audit.resultado_global
                                ? "text-emerald-300/90"
                                : "text-red-300/90"
                            }`}
                          >
                            {audit.resultado_global ? "PASS" : "FAIL"}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(audit.fecha_ejecucion)}
                          </span>
                        </div>
                        <p className="mt-2 shrink-0 text-xs text-neutral-500">
                          {audit.vulnerabilidades_detectadas} vulnerabilidades
                          detectadas
                        </p>
                        <pre
                          className={`mt-3 overflow-auto rounded-lg border border-neutral-800/60 bg-neutral-950/50 p-4 font-mono text-[11px] leading-relaxed text-neutral-400 ${
                            index === 0
                              ? "min-h-[min(22rem,calc(100dvh-18rem))] flex-1"
                              : "min-h-48 max-h-80"
                          }`}
                        >
                          {audit.logs_sandbox}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {panel}
      {deleteModalOpen && detail && (
        <AssetDeleteConfirmModal
          assetName={detail.nombre}
          assetVersion={detail.version}
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => {
            if (isDeleting) return;
            setDeleteModalOpen(false);
            setDeleteError(null);
          }}
          onConfirm={() => void handleDeleteConfirm()}
        />
      )}
    </>,
    document.body,
  );
}
