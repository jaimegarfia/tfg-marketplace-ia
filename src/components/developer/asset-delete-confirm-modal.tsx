"use client";

import { useEffect, useId, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface AssetDeleteConfirmModalProps {
  assetName: string;
  assetVersion: string;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function AssetDeleteConfirmModal({
  assetName,
  assetVersion,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: AssetDeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const inputId = useId();
  const canConfirm = confirmText.trim() === assetName.trim();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-overlay-in"
        onClick={isDeleting ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="asset-delete-title"
        aria-describedby="asset-delete-desc"
        className="
          relative z-10 flex w-full max-w-md flex-col
          rounded-t-2xl border border-neutral-800/80 bg-[#0b0d10]
          shadow-2xl shadow-black/50 animate-fade-up
          sm:rounded-2xl
        "
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800/60 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-900/40 bg-amber-950/30">
              <AlertTriangle
                size={16}
                strokeWidth={1.5}
                className="text-amber-400/90"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p
                id="asset-delete-title"
                className="text-base font-medium tracking-tight text-neutral-100"
              >
                Eliminar activo
              </p>
              <p className="mt-0.5 truncate text-sm text-neutral-500">
                {assetName}{" "}
                <span className="font-mono text-neutral-600">v{assetVersion}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-300 disabled:opacity-50"
          >
            <X size={16} strokeWidth={1.25} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <p id="asset-delete-desc" className="text-sm leading-relaxed text-neutral-400">
            El activo dejará de aparecer en el marketplace y se borrarán su historial de
            auditorías y valoraciones. Esta acción es irreversible.
          </p>

          <ul className="space-y-1.5 text-xs text-neutral-500">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-600" />
              Se elimina del catálogo público
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-600" />
              Se borran auditorías y metadatos asociados
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neutral-600" />
              La acción no se puede deshacer
            </li>
          </ul>

          <div>
            <label htmlFor={inputId} className="mb-1.5 block text-xs text-neutral-500">
              Escribe{" "}
              <span className="font-medium text-neutral-300">{assetName}</span> para
              confirmar
            </label>
            <input
              id={inputId}
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              disabled={isDeleting}
              autoComplete="off"
              spellCheck={false}
              placeholder={assetName}
              className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-700 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-300/90">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-800/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-neutral-800/80 px-4 py-2.5 text-sm text-neutral-400 transition hover:text-neutral-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? "Eliminando..." : "Eliminar permanentemente"}
          </button>
        </div>
      </div>
    </div>
  );
}
