"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getSessionAction,
  logoutAction,
  type SessionUserDto,
} from "@/app/auth/actions";
import type { RolUsuario } from "@/types/database";

export type AuthIntent = "buyer" | "developer";

/** Usuario autenticado expuesto en cliente (compatible con componentes existentes). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RolUsuario;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  authIntent: AuthIntent;
  isAuthModalOpen: boolean;
  openAuthModal: (intent?: AuthIntent) => void;
  closeAuthModal: () => void;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(dto: SessionUserDto): AuthUser {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("buyer");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refreshSession = useCallback(async () => {
    const session = await getSessionAction();
    setUser(session ? toAuthUser(session) : null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const openAuthModal = useCallback((intent: AuthIntent = "buyer") => {
    setAuthIntent(intent);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    await logoutAction();
    setUser(null);
    window.location.href = "/";
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      authIntent,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      refreshSession,
      signOut,
    }),
    [
      user,
      isLoading,
      authIntent,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      refreshSession,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}

/** Alias temporal para migración desde mock auth. */
export const useMockAuth = useAuth;
