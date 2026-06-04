"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Store,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  developerGateLoginAction,
} from "@/app/developer/dashboard/actions";
import { registerAndRedirectAction } from "@/app/auth/actions";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { TermsAcceptance } from "@/components/legal/terms-acceptance";
import { getPasswordValidationError } from "@/lib/auth/password-policy";

type GateMode = "login" | "register";

export function DeveloperDashboardGate() {
  const { openAuthModal } = useAuth();
  const [mode, setMode] = useState<GateMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (mode === "register" && !acceptedTerms) {
      setError(
        "Debes aceptar los términos y la política de privacidad para registrarte.",
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Introduce correo y contraseña.");
      return;
    }

    if (mode === "register" && !fullName.trim()) {
      setError("Introduce el nombre de tu estudio o empresa.");
      return;
    }

    if (mode === "register") {
      const passwordError = getPasswordValidationError(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    startTransition(async () => {
      if (mode === "register") {
        const result = await registerAndRedirectAction({
          email: email.trim(),
          password,
          nombre: fullName.trim(),
          accountType: "developer",
        });
        if (result?.ok === false) {
          setError(result.error);
        }
        return;
      }

      const result = await developerGateLoginAction({
        email: email.trim(),
        password,
      });
      if (result?.ok === false) {
        setError(result.error);
      }
    });
  };

  return (
    <MarketplaceShell>
      <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-[#0b0d10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
          >
            <Shield
              size={18}
              strokeWidth={1.25}
              className="text-emerald-400/90"
              aria-hidden="true"
            />
            <span className="text-lg font-semibold tracking-tight text-neutral-100">
              Certia
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800/80 px-3 py-2 text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
          >
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            Ir al marketplace
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-[1400px] flex-col items-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-400/90">
              <Store size={20} strokeWidth={1.25} aria-hidden="true" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-100 sm:text-2xl">
              Consola de desarrollador
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
              Crea tu cuenta de vendedor o inicia sesión para publicar y
              gestionar agentes en Certia.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-6 sm:p-8">
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-neutral-800/80 bg-neutral-900/50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setAcceptedTerms(false);
                  setError(null);
                }}
                className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                  mode === "login"
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                  mode === "register"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <label
                    htmlFor="gate-name"
                    className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                  >
                    Nombre del estudio
                  </label>
                  <input
                    id="gate-name"
                    type="text"
                    required
                    value={fullName}
                    disabled={isPending}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Mi AI Studio"
                    className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="gate-email"
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                >
                  Correo electrónico
                </label>
                <input
                  id="gate-email"
                  type="email"
                  required
                  value={email}
                  disabled={isPending}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="gate-password"
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500"
                >
                  Contraseña
                </label>
                <input
                  id="gate-password"
                  type="password"
                  required
                  value={password}
                  disabled={isPending}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    mode === "register" ? "Ej. Certia2026" : "Tu contraseña"
                  }
                  className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
                />
              </div>

              {mode === "register" && (
                <PasswordStrengthIndicator
                  password={password}
                  id="gate-password-strength"
                />
              )}

              {mode === "register" && (
                <TermsAcceptance
                  id="gate-accept-terms"
                  checked={acceptedTerms}
                  disabled={isPending}
                  onChange={setAcceptedTerms}
                />
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300/90"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-neutral-900"
                      aria-hidden="true"
                    />
                    Procesando...
                  </>
                ) : mode === "register" ? (
                  <>
                    <UserPlus size={14} strokeWidth={1.5} aria-hidden="true" />
                    Crear cuenta de desarrollador
                  </>
                ) : (
                  <>
                    Entrar a la consola
                    <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-neutral-600">
              ¿Ya tienes cuenta demo del seed? Regístrate con un email nuevo o
              migra con{" "}
              <span className="font-mono text-neutral-500">migration-auth.sql</span>
              .
            </p>

            <div className="mt-4 border-t border-neutral-800/60 pt-4 text-center">
              <button
                type="button"
                onClick={() => openAuthModal("developer")}
                disabled={isPending}
                className="text-xs text-neutral-500 transition hover:text-neutral-300 disabled:opacity-50"
              >
                Abrir modal de acceso global
              </button>
            </div>
          </div>
        </div>
      </main>
    </MarketplaceShell>
  );
}
