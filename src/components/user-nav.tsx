"use client";

import { Receipt, User } from "lucide-react";

export function UserNav() {
  return (
    <div className="flex items-center gap-4">
      {/* Historial de transacciones */}
      <button
        type="button"
        aria-label="Historial de transacciones"
        className="flex h-8 w-8 items-center justify-center rounded-lg
                   text-neutral-500 transition-colors duration-200
                   hover:bg-white/[0.04] hover:text-neutral-300"
      >
        <Receipt size={15} strokeWidth={1.25} aria-hidden="true" />
      </button>

      {/* Separador vertical */}
      <span
        className="h-4 w-px bg-neutral-800"
        aria-hidden="true"
      />

      {/* Avatar simulado con iniciales */}
      <button
        type="button"
        aria-label="Cuenta de usuario"
        className="group flex items-center gap-2.5 transition-colors duration-200"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full
                     border border-neutral-700/80 bg-neutral-800/80
                     text-[10px] font-medium uppercase tracking-wider text-neutral-400
                     transition-colors duration-200 group-hover:border-neutral-600
                     group-hover:text-neutral-300"
        >
          JG
        </span>
        <span className="hidden text-xs text-neutral-400 transition-colors
                         duration-200 group-hover:text-neutral-300 sm:inline">
          Jaime
        </span>
      </button>
    </div>
  );
}
