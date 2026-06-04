"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface UserMenuProps {
  /** En la consola desarrollador el menú incluye volver al marketplace. */
  variant?: "marketplace" | "developer";
}

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ variant = "marketplace" }: UserMenuProps) {
  const pathname = usePathname();
  const { user, isLoading, openAuthModal, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const isDeveloperConsole =
    variant === "developer" || pathname.startsWith("/developer");

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (isLoading) {
    return (
      <span
        className="inline-block h-9 w-24 animate-pulse rounded-lg bg-neutral-800/80"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("buyer")}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-800/80 bg-neutral-900/40 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-700 hover:text-neutral-100"
      >
        Iniciar sesión
      </button>
    );
  }

  const initials = initialsFromName(user.name) || "US";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-transparent py-1 pl-1 pr-2 transition hover:border-neutral-800/80 hover:bg-white/[0.03]"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-800/80 text-[10px] font-medium uppercase tracking-wide text-neutral-300"
        >
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-left text-xs font-medium text-neutral-200 sm:inline">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-neutral-800/90 bg-neutral-950 py-1 shadow-xl shadow-black/50"
        >
          <div className="border-b border-neutral-800/80 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-neutral-100">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-neutral-500">{user.email}</p>
          </div>

          <Link
            href="/cuenta"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/[0.04] hover:text-neutral-100"
          >
            <Settings size={15} strokeWidth={1.5} aria-hidden="true" />
            Ajustes de cuenta
          </Link>

          {user.role === "desarrollador" && !isDeveloperConsole && (
            <Link
              href="/developer/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/[0.04] hover:text-neutral-100"
            >
              <LayoutDashboard size={15} strokeWidth={1.5} aria-hidden="true" />
              Mi panel de desarrollador
            </Link>
          )}

          {isDeveloperConsole && (
            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/[0.04] hover:text-neutral-100"
            >
              <Store size={15} strokeWidth={1.5} aria-hidden="true" />
              Ir al marketplace
            </Link>
          )}

          <div className="my-1 border-t border-neutral-800/80" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300/90 transition hover:bg-red-500/10"
          >
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
