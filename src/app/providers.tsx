"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { AuthModal } from "@/components/auth-modal";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
    </AuthProvider>
  );
}
