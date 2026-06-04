"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Trash2 } from "lucide-react";
import type { UserProfileRecord } from "@/lib/auth/account-service";
import {
  deleteAccountAction,
  updateAccountProfileAction,
} from "@/app/cuenta/actions";
import { useAuth } from "@/context/auth-context";

interface CuentaSettingsClientProps {
  profile: UserProfileRecord;
}

const FIELD =
  "w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600";

export function CuentaSettingsClient({ profile }: CuentaSettingsClientProps) {
  const { refreshSession } = useAuth();
  const [nombre, setNombre] = useState(profile.nombre);
  const [empresa, setEmpresa] = useState(profile.empresa ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startSave(async () => {
      const result = await updateAccountProfileAction({
        nombre,
        empresa: empresa.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await refreshSession();
      setMessage("Perfil actualizado. El nombre en la cabecera ya refleja los cambios.");
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setError(null);
      return;
    }

    setError(null);
    startDelete(async () => {
      const result = await deleteAccountAction();
      if (!result.ok) {
        setError(result.error);
        setDeleteConfirm(false);
        return;
      }
      window.location.href = "/";
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href={profile.rol === "desarrollador" ? "/developer/dashboard" : "/"}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
          Volver
        </Link>
        <div className="mt-4 flex items-center gap-2">
          <Shield
            size={18}
            className="text-emerald-400/90"
            aria-hidden="true"
          />
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
            Ajustes de cuenta
          </h1>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Gestiona tu nombre visible, datos de empresa y opciones de la cuenta.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-5"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="cuenta-nombre"
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
          >
            Nombre visible
          </label>
          <input
            id="cuenta-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={FIELD}
          />
          <p className="text-[11px] text-neutral-600">
            Es el nombre que aparece en el menú de usuario del marketplace.
          </p>
        </div>

        {profile.rol === "empresa" && (
          <div className="space-y-1.5">
            <label
              htmlFor="cuenta-empresa"
              className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
            >
              Empresa (opcional)
            </label>
            <input
              id="cuenta-empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nombre de tu organización"
              className={FIELD}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="cuenta-email"
            className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
          >
            Correo electrónico
          </label>
          <input
            id="cuenta-email"
            value={profile.email}
            readOnly
            className={`${FIELD} cursor-not-allowed opacity-60`}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300/90"
          >
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200/90">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <section className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-5">
        <h2 className="text-sm font-medium text-red-200/90">Zona de peligro</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Eliminar la cuenta borra tu perfil y los datos asociados en Neon
          (transacciones, solicitudes de adaptación y activos publicados si eres
          desarrollador). Esta acción no se puede deshacer.
        </p>
        {deleteConfirm && (
          <p className="mt-3 text-xs text-red-300/80">
            Pulsa de nuevo para confirmar la eliminación permanente.
          </p>
        )}
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-60"
        >
          <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
          {isDeleting
            ? "Eliminando..."
            : deleteConfirm
              ? "Confirmar eliminación"
              : "Eliminar mi cuenta"}
        </button>
      </section>
    </div>
  );
}
