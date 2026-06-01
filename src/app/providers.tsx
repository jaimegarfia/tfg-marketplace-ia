"use client";

import type { ReactNode } from "react";
import { MockAuthProvider } from "@/context/mock-auth-context";
import { MockAuthModal } from "@/components/mock-auth-modal";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MockAuthProvider>
      {children}
      <MockAuthModal />
    </MockAuthProvider>
  );
}
