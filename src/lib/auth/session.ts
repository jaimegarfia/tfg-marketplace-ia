import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { RolUsuario } from "@/types/database";

export const SESSION_COOKIE = "certia_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export interface SessionPayload {
  sub: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  exp: number;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET no configurado. Define una clave de al menos 16 caracteres.",
    );
  }
  return "certia-dev-secret-change-me";
}

function sign(body: string): string {
  return createHmac("sha256", getAuthSecret()).update(body).digest("base64url");
}

export function createSessionToken(
  user: Pick<SessionPayload, "sub" | "email" | "nombre" | "rol">,
): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(body);

  try {
    const sigBuf = Buffer.from(signature, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (
      !payload.sub ||
      !payload.email ||
      !payload.nombre ||
      !payload.rol ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return parseSessionToken(token);
}

export async function setSessionCookie(
  user: Pick<SessionPayload, "sub" | "email" | "nombre" | "rol">,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("certia_developer_email");
}
