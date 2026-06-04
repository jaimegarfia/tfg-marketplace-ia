"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  loginAction,
  oauthLoginAction,
  registerAction,
} from "@/app/auth/actions";
import {
  AppleBrandIcon,
  GoogleBrandIcon,
} from "@/components/auth/oauth-brand-icons";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { TermsAcceptance } from "@/components/legal/terms-acceptance";
import { getPasswordValidationError } from "@/lib/auth/password-policy";

const inputClassName =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-600";

const labelClassName =
  "font-mono text-[10px] uppercase tracking-widest text-zinc-500";

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, authIntent, refreshSession } =
    useAuth();
  const [accountMode, setAccountMode] = useState<"buyer" | "developer">("buyer");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  const isDeveloperMode = accountMode === "developer";

  useEffect(() => {
    if (!isAuthModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const mode = authIntent === "developer" ? "developer" : "buyer";
    setAccountMode(mode);
    setIsSignUp(mode === "developer");
    setFullName("");
    setCompanyName("");
    setEmail("");
    setPassword("");
    setAcceptedTerms(false);
    setErrorMessage(null);
  }, [isAuthModalOpen, authIntent]);

  if (!isAuthModalOpen) return null;

  const title = isDeveloperMode
    ? isSignUp
      ? "Registro de desarrollador"
      : "Acceso desarrollador"
    : isSignUp
      ? "Crear cuenta"
      : "Iniciar sesión";

  const submitLabel = isDeveloperMode
    ? isSignUp
      ? "Crear cuenta y entrar"
      : "Entrar al panel"
    : isSignUp
      ? "Crear cuenta"
      : "Acceder";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSignUp && !acceptedTerms) {
      setErrorMessage(
        "Debes aceptar los términos y la política de privacidad para registrarte.",
      );
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Completa correo electrónico y contraseña.");
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMessage("Completa tu nombre para crear la cuenta.");
      return;
    }

    if (isSignUp) {
      const passwordError = getPasswordValidationError(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        return;
      }
    }

    setErrorMessage(null);

    startSubmitTransition(async () => {
      if (isSignUp) {
        const result = await registerAction({
          email: email.trim(),
          password,
          nombre: fullName.trim(),
          accountType: isDeveloperMode ? "developer" : "buyer",
          companyName: companyName.trim() || undefined,
        });

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        await refreshSession();
        closeAuthModal();
        if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
        return;
      }

      const result = await loginAction({
        email: email.trim(),
        password,
        expectedRole: isDeveloperMode ? "desarrollador" : undefined,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      await refreshSession();
      closeAuthModal();
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  };

  const handleOAuthSignIn = (provider: "google" | "apple") => {
    if (isSignUp && !acceptedTerms) {
      setErrorMessage(
        "Debes aceptar los términos y la política de privacidad para registrarte.",
      );
      return;
    }

    setErrorMessage(null);

    startSubmitTransition(async () => {
      const result = await oauthLoginAction({
        provider,
        accountType: isDeveloperMode ? "developer" : "buyer",
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      await refreshSession();
      closeAuthModal();
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar modal de autenticación"
        onClick={closeAuthModal}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Autenticación"
        className="relative flex max-h-[min(92dvh,100%)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 sm:max-h-[min(90dvh,720px)] sm:rounded-2xl"
      >
        {/* Cabecera fija */}
        <div className="shrink-0 border-b border-zinc-800/80 px-4 pb-3 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Shield
                size={14}
                strokeWidth={1.25}
                className="shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-medium tracking-tight text-zinc-100">
                  {title}
                </h2>
                <p className="truncate text-[11px] text-zinc-500">
                  Cuenta Certia ·{" "}
                  {isDeveloperMode ? "Desarrollador" : "Comprador"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAuthModal}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
              aria-label="Cerrar"
            >
              <X size={16} strokeWidth={1.25} />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Tipo de cuenta"
            className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isDeveloperMode}
              onClick={() => {
                setAccountMode("buyer");
                setIsSignUp(false);
                setErrorMessage(null);
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                !isDeveloperMode
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Comprador
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isDeveloperMode}
              onClick={() => {
                setAccountMode("developer");
                setIsSignUp(true);
                setErrorMessage(null);
              }}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                isDeveloperMode
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Desarrollador
            </button>
          </div>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
        >
          {/* Cuerpo con scroll */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
            <div className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="auth-full-name" className={labelClassName}>
                      {isDeveloperMode
                        ? "Nombre del estudio"
                        : "Nombre completo"}
                    </label>
                    <input
                      id="auth-full-name"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder={
                        isDeveloperMode ? "Mi AI Studio" : "Jaime González"
                      }
                      className={inputClassName}
                    />
                  </div>

                  {!isDeveloperMode && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="auth-company-name"
                        className={labelClassName}
                      >
                        Empresa (opcional)
                      </label>
                      <input
                        id="auth-company-name"
                        type="text"
                        value={companyName}
                        onChange={(event) =>
                          setCompanyName(event.target.value)
                        }
                        placeholder="ComplianceHub EU"
                        className={inputClassName}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <label htmlFor="auth-email" className={labelClassName}>
                  Correo electrónico
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="usuario@empresa.com"
                  className={inputClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-password" className={labelClassName}>
                  Contraseña
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={
                    isSignUp ? "new-password" : "current-password"
                  }
                  placeholder={isSignUp ? "Ej. Certia2026" : "Tu contraseña"}
                  className={inputClassName}
                />
              </div>

              {isSignUp && (
                <PasswordStrengthIndicator
                  password={password}
                  id="auth-password-strength"
                  variant="compact"
                />
              )}

              {isSignUp && (
                <TermsAcceptance
                  id="auth-accept-terms"
                  checked={acceptedTerms}
                  disabled={isSubmitting}
                  onChange={(checked) => {
                    setAcceptedTerms(checked);
                    if (checked) setErrorMessage(null);
                  }}
                />
              )}

              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-400/25 bg-red-400/10 px-2.5 py-1.5 text-xs text-red-200"
                >
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          {/* Pie fijo: acciones siempre visibles */}
          <div className="shrink-0 space-y-2.5 border-t border-zinc-800/80 bg-zinc-950 px-4 py-3 sm:px-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Procesando..." : submitLabel}
              {!isSubmitting && (
                <ArrowRight size={14} strokeWidth={1.25} aria-hidden="true" />
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <p className="relative mx-auto w-fit bg-zinc-950 px-2 text-[10px] text-zinc-500">
                o continuar con
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOAuthSignIn("google")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#747775] bg-white px-4 text-[13px] font-medium text-[#1f1f1f] transition hover:bg-[#f8f9fa] disabled:opacity-60"
                style={{ fontFamily: "Roboto, Arial, sans-serif" }}
                aria-label="Continuar con Google"
              >
                <GoogleBrandIcon />
                Continuar con Google
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOAuthSignIn("apple")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-black px-4 text-[13px] font-medium text-white transition hover:bg-zinc-900 disabled:opacity-60"
                aria-label="Continuar con Apple"
              >
                <AppleBrandIcon />
                Continuar con Apple
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSignUp((prev) => !prev);
                setAcceptedTerms(false);
                setErrorMessage(null);
              }}
              className="w-full py-0.5 text-center text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {isSignUp
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
