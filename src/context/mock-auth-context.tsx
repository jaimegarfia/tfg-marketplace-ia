"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthIntent = "buyer" | "developer";

export interface MockUser {
  name: string;
  email: string;
  role: "empresa" | "particular" | "desarrollador";
}

interface AuthorizePayload {
  name?: string;
  email?: string;
  role?: MockUser["role"];
}

interface MockAuthContextValue {
  user: MockUser | null;
  authIntent: AuthIntent;
  isAuthModalOpen: boolean;
  openAuthModal: (intent?: AuthIntent) => void;
  closeAuthModal: () => void;
  authorizeAccess: (payload?: AuthorizePayload) => void;
  signOut: () => void;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

const MOCK_USER: MockUser = {
  name: "Jaime",
  email: "jaime@ejemplo.com",
  role: "particular",
};

interface MockAuthProviderProps {
  children: ReactNode;
}

/**
 * Estado global de autenticación simulada para el MVP.
 * No persiste en almacenamiento: al recargar vuelve a usuario anónimo.
 */
export function MockAuthProvider({ children }: MockAuthProviderProps) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("buyer");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = useCallback((intent: AuthIntent = "buyer") => {
    setAuthIntent(intent);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const authorizeAccess = useCallback((payload?: AuthorizePayload) => {
    setUser({
      name: payload?.name?.trim() || MOCK_USER.name,
      email: payload?.email?.trim() || MOCK_USER.email,
      role: payload?.role ?? MOCK_USER.role,
    });
    setIsAuthModalOpen(false);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<MockAuthContextValue>(
    () => ({
      user,
      authIntent,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authorizeAccess,
      signOut,
    }),
    [
      user,
      authIntent,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authorizeAccess,
      signOut,
    ],
  );

  return (
    <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
  );
}

export function useMockAuth(): MockAuthContextValue {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth debe usarse dentro de MockAuthProvider.");
  }
  return context;
}
