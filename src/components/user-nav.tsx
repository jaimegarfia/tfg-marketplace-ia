"use client";

import { Receipt, User } from "lucide-react";
import { useMockAuth } from "@/context/mock-auth-context";

export function UserNav() {
  const { user, openAuthModal } = useMockAuth();

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-800/80 bg-neutral-900/40 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-700 hover:text-neutral-100"
      >
        <User size={14} strokeWidth={1.25} aria-hidden="true" />
        Iniciar sesión
      </button>
    );
  }

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
          {user.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden text-xs text-neutral-400 transition-colors
                         duration-200 group-hover:text-neutral-300 sm:inline">
          {user.name}
        </span>
      </button>
    </div>
  );
}
