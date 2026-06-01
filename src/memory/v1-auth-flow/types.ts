/**
 * Tipos de dominio para documentar el flujo de autenticación y adquisición.
 * Este módulo está pensado para memoria técnica (TFG, sección 4.3).
 */

export type SessionRole = "individual" | "organization";
export type AuthProvider = "password" | "google" | "apple";

export interface UserSession {
  sessionId: string;
  userId: string;
  displayName: string;
  email: string;
  role: SessionRole;
  organizationName: string | null;
  complianceAccepted: boolean;
  provider: AuthProvider;
  authenticatedAt: string;
}

export type AgentAssetType = "runtime_artifact" | "reference_architecture";
export type AgentAuditStatus =
  | "borrador"
  | "en_auditoria"
  | "certificado"
  | "rechazado";

export interface IAAgent {
  agentId: string;
  ownerId: string;
  name: string;
  version: string;
  priceUsd: number;
  assetType: AgentAssetType;
  auditStatus: AgentAuditStatus;
}

export type TransactionStatus = "pending" | "completed" | "failed";

export interface TransactionRecord {
  transactionId: string;
  buyerUserId: string;
  agentId: string;
  amountUsd: number;
  currency: "USD";
  status: TransactionStatus;
  paymentProvider: "stripe_mock";
  createdAt: string;
}

export type AuthViewMode = "signIn" | "signUp";

export interface AuthFormPayload {
  fullName: string;
  organizationName: string;
  email: string;
  password: string;
  complianceAccepted: boolean;
}
