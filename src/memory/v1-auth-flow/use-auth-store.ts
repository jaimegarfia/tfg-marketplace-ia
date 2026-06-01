"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AuthFormPayload,
  AuthProvider,
  AuthViewMode,
  SessionRole,
  UserSession,
} from "./types";

interface AuthState {
  currentUser: UserSession | null;
  isModalOpen: boolean;
  viewMode: AuthViewMode;
  isSubmitting: boolean;
  errorMessage: string | null;
}

interface AuthActions {
  openModal: (mode?: AuthViewMode) => void;
  closeModal: () => void;
  switchMode: (mode: AuthViewMode) => void;
  authenticateWithPassword: (payload: AuthFormPayload) => Promise<void>;
  authenticateWithProvider: (
    provider: Exclude<AuthProvider, "password">,
    complianceAccepted: boolean,
  ) => Promise<void>;
  signOut: () => void;
}

export type UseAuthStoreResult = AuthState & AuthActions;

const DEFAULT_AUTH_STATE: AuthState = {
  currentUser: null,
  isModalOpen: false,
  viewMode: "signIn",
  isSubmitting: false,
  errorMessage: null,
};

/**
 * Clase documental para centralizar reglas de negocio del flujo auth.
 * Permite mantener UI y validaciones desacopladas.
 */
export class AuthFlowController {
  static validatePayload(
    mode: AuthViewMode,
    payload: AuthFormPayload,
  ): string | null {
    if (!payload.complianceAccepted) {
      return "Compliance terms must be accepted.";
    }
    if (!payload.email.trim() || !payload.password.trim()) {
      return "Email and password are required.";
    }
    if (mode === "signUp" && !payload.fullName.trim()) {
      return "Full name is required for sign up.";
    }
    return null;
  }

  static buildSession(
    payload: AuthFormPayload,
    provider: AuthProvider,
  ): UserSession {
    const role: SessionRole = payload.organizationName.trim()
      ? "organization"
      : "individual";

    return {
      sessionId: `sess_${crypto.randomUUID()}`,
      userId: `usr_${crypto.randomUUID()}`,
      displayName: payload.fullName.trim() || "Guest User",
      email: payload.email.trim(),
      role,
      organizationName: payload.organizationName.trim() || null,
      complianceAccepted: payload.complianceAccepted,
      provider,
      authenticatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Hook autocontenido para MVP: controla login, registro, OAuth simulado
 * y validación obligatoria de términos de compliance.
 */
export function useAuthStore(): UseAuthStoreResult {
  const [state, setState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  const openModal = useCallback((mode: AuthViewMode = "signIn") => {
    setState((previous) => ({
      ...previous,
      isModalOpen: true,
      viewMode: mode,
      errorMessage: null,
    }));
  }, []);

  const closeModal = useCallback(() => {
    setState((previous) => ({
      ...previous,
      isModalOpen: false,
      isSubmitting: false,
      errorMessage: null,
    }));
  }, []);

  const switchMode = useCallback((mode: AuthViewMode) => {
    setState((previous) => ({
      ...previous,
      viewMode: mode,
      errorMessage: null,
    }));
  }, []);

  const authenticateWithPassword = useCallback(
    async (payload: AuthFormPayload) => {
      const validationResult = AuthFlowController.validatePayload(
        state.viewMode,
        payload,
      );
      if (validationResult) {
        setState((previous) => ({ ...previous, errorMessage: validationResult }));
        return;
      }

      setState((previous) => ({
        ...previous,
        isSubmitting: true,
        errorMessage: null,
      }));

      // Simulación de round-trip de autenticación.
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });

      const authenticatedUser = AuthFlowController.buildSession(
        payload,
        "password",
      );

      setState((previous) => ({
        ...previous,
        currentUser: authenticatedUser,
        isModalOpen: false,
        isSubmitting: false,
      }));
    },
    [state.viewMode],
  );

  const authenticateWithProvider = useCallback(
    async (
      provider: Exclude<AuthProvider, "password">,
      complianceAccepted: boolean,
    ) => {
      if (!complianceAccepted) {
        setState((previous) => ({
          ...previous,
          errorMessage: "Compliance terms must be accepted.",
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        isSubmitting: true,
        errorMessage: null,
      }));

      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 350);
      });

      const fallbackName = provider === "google" ? "Google User" : "Apple User";
      const fallbackEmail =
        provider === "google" ? "user@googlemail.com" : "user@icloud.com";

      const authenticatedUser = AuthFlowController.buildSession(
        {
          fullName: fallbackName,
          organizationName: "",
          email: fallbackEmail,
          password: "oauth_token",
          complianceAccepted,
        },
        provider,
      );

      setState((previous) => ({
        ...previous,
        currentUser: authenticatedUser,
        isModalOpen: false,
        isSubmitting: false,
      }));
    },
    [],
  );

  const signOut = useCallback(() => {
    setState((previous) => ({
      ...previous,
      currentUser: null,
    }));
  }, []);

  return useMemo<UseAuthStoreResult>(
    () => ({
      ...state,
      openModal,
      closeModal,
      switchMode,
      authenticateWithPassword,
      authenticateWithProvider,
      signOut,
    }),
    [
      state,
      openModal,
      closeModal,
      switchMode,
      authenticateWithPassword,
      authenticateWithProvider,
      signOut,
    ],
  );
}
