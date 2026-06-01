"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Shield, X } from "lucide-react";
import { useMockAuth } from "@/context/mock-auth-context";

/**
 * Modal de autenticación B2B simulado para el MVP.
 * Mantiene UX de login/registro sin depender de backend real.
 */
export function MockAuthModal() {
  const { isAuthModalOpen, closeAuthModal, authorizeAccess } = useMockAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("Jaime");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("jaime@ejemplo.com");
  const [password, setPassword] = useState("********");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    // Reinicia el formulario cada vez que se abre el modal.
    setIsSignUp(false);
    setFullName("Jaime");
    setCompanyName("");
    setEmail("jaime@ejemplo.com");
    setPassword("********");
    setAcceptedTerms(false);
    setErrorMessage(null);
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const title = isSignUp
    ? "Crear una cuenta"
    : "Iniciar sesión en Certia";
  const submitLabel = isSignUp
    ? "Crear cuenta"
    : "Acceder";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!acceptedTerms) {
      setErrorMessage(
        "Debes aceptar los términos para continuar con la autenticación.",
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

    setErrorMessage(null);
    const role = companyName.trim() ? "empresa" : "particular";
    authorizeAccess({
      name: isSignUp ? fullName : "Jaime",
      email,
      role,
    });
  };

  const handleOAuthSignIn = (provider: "google" | "apple") => {
    if (!acceptedTerms) {
      setErrorMessage(
        "Debes aceptar los términos antes de usar autenticación social.",
      );
      return;
    }

    setErrorMessage(null);
    const role = companyName.trim() ? "empresa" : "particular";
    authorizeAccess({
      name: provider === "google" ? "Jaime Google" : "Jaime Apple",
      email: provider === "google" ? "jaime@googlemail.com" : "jaime@icloud.com",
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Cerrar modal de autenticación"
        onClick={closeAuthModal}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Autenticación corporativa"
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/60 transition-all"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="inline-flex items-center gap-2">
            <Shield
              size={14}
              strokeWidth={1.25}
              className="text-zinc-400"
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Autenticación B2B
            </span>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
            aria-label="Cerrar"
          >
            <X size={14} strokeWidth={1.25} />
          </button>
        </div>

        <h2 className="mt-6 text-2xl font-medium tracking-tight text-zinc-100">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Introduce tus credenciales para acceder al marketplace seguro.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
              isSignUp ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
            }`}
            aria-hidden={!isSignUp}
          >
            <div className="space-y-4 pb-1">
              <div className="space-y-2">
                <label
                  htmlFor="mock-auth-full-name"
                  className="font-mono text-[10px] uppercase tracking-widest text-zinc-500"
                >
                  Nombre completo
                </label>
                <input
                  id="mock-auth-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jaime González"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="mock-auth-company-name"
                  className="font-mono text-[10px] uppercase tracking-widest text-zinc-500"
                >
                  Empresa u Organización (Opcional)
                </label>
                <input
                  id="mock-auth-company-name"
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Empresa S.A."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="mock-auth-email"
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500"
            >
              Correo electrónico
            </label>
            <input
              id="mock-auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="usuario@empresa.com"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="mock-auth-password"
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500"
            >
              Contraseña
            </label>
            <input
              id="mock-auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </div>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                if (event.target.checked) setErrorMessage(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-0"
            />
            <span className="text-xs leading-relaxed text-zinc-400">
              Acepto los términos de servicio y la política de privacidad de la
              plataforma.
            </span>
          </label>

          {errorMessage && (
            <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-200">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-white"
          >
            {submitLabel}
            <ArrowRight size={14} strokeWidth={1.25} aria-hidden="true" />
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <p className="relative mx-auto w-fit bg-zinc-950 px-2 text-[11px] text-zinc-500">
              O continuar con
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Wrapper tipo Google Identity (mock visual para MVP). */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#747775] bg-white px-4 text-[13px] font-medium text-[#1f1f1f] transition hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
              style={{ fontFamily: "Roboto, Arial, sans-serif" }}
              aria-label="Continuar con Google"
            >
              <GoogleBrandIcon />
              <span className="whitespace-nowrap">Continuar con Google</span>
            </button>

            {/* Wrapper solicitado por Apple (`appleid-signin`). */}
            <div
              id="appleid-signin"
              data-color="black"
              data-border="true"
              data-type="continue"
              data-border-radius="12"
              data-mode="center-align"
              data-width="100%"
              data-height="44"
              className="w-full"
            >
              <button
                type="button"
                onClick={() => handleOAuthSignIn("apple")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-black px-4 text-[13px] font-medium text-white transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                aria-label="Continuar con Apple"
              >
                <AppleBrandIcon />
                <span className="whitespace-nowrap">Continuar con Apple</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSignUp((prev) => !prev);
              setErrorMessage(null);
            }}
            className="w-full text-center text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {isSignUp
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleBrandIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 48 48"
      className="shrink-0"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.194 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.297 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.297 4 24 4c-7.682 0-14.407 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.196 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.145 35.091 26.715 36 24 36c-5.173 0-9.62-3.315-11.283-7.946l-6.522 5.025C9.435 39.556 16.624 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.565l.003-.002 6.19 5.238C36.971 39.2 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AppleBrandIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="18"
      viewBox="0 0 814 1000"
      className="shrink-0 fill-white"
    >
      <path d="M788.8 779.4c-10.5 24.2-23.1 47.1-37.8 68.7-20 29.3-36.4 49.5-49.4 60.6-20.1 18.2-41.6 27.5-64.7 28-16.6 0-36.7-4.7-60.1-14.2-23.5-9.5-45-14.2-64.6-14.2-20.5 0-42.5 4.7-66.1 14.2-23.7 9.5-42.8 14.4-57.3 14.9-22.2 0.9-44.2-8.8-65.9-29.1-13.8-12.1-30.9-33-51.3-62.6-21.8-31.4-39.7-67.8-53.6-109.2-14.9-44.7-22.4-88-22.4-129.9 0-48 10.4-89.4 31.1-124.2 16.3-27.9 38.1-49.9 65.3-66 27.3-16.1 56.7-24.3 88.2-24.8 17.3 0 40.1 5.4 68.4 16 28.2 10.7 46.2 16 53.9 16 5.8 0 25.5-6.1 58.9-18.2 31.6-11.3 58.3-16.1 79.9-14.4 58.5 4.7 102.4 27.8 131.6 69.2-52.3 31.7-78.2 76.1-77.7 133.1 0.5 44.4 16.6 81.4 48.3 111 14.4 13.8 30.5 24.4 48.3 31.8-3.9 11.1-8.1 22-12.8 32.9zM625.7 186.7c0 34.8-12.7 67.3-38.1 97.4-30.7 35.8-67.9 56.5-108.2 53.2-0.5-4.2-0.8-8.6-0.8-13.2 0-33.4 14.6-69.2 40.5-98.5 12.9-14.9 29.2-27.2 48.9-36.9 19.7-9.5 38.3-14.8 56-15.9 0.9 4.6 1.7 9.2 1.7 13.9z" />
    </svg>
  );
}
