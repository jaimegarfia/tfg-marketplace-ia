"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  authenticateUser,
  registerUser,
  type RegisterInput,
} from "@/lib/auth/user-service";
import {
  resolveOAuthDemoUser,
  type OAuthAccountType,
  type OAuthProvider,
} from "@/lib/auth/oauth-demo";
import {
  clearSessionCookie,
  getSessionFromCookies,
  setSessionCookie,
} from "@/lib/auth/session";
import type { RolUsuario } from "@/types/database";

export interface SessionUserDto {
  id: string;
  name: string;
  email: string;
  role: RolUsuario;
}

export async function getSessionAction(): Promise<SessionUserDto | null> {
  const session = await getSessionFromCookies();
  if (!session) return null;

  return {
    id: session.sub,
    name: session.nombre,
    email: session.email,
    role: session.rol,
  };
}

export async function loginAction(input: {
  email: string;
  password: string;
  expectedRole?: RolUsuario;
}): Promise<
  | { ok: true; user: SessionUserDto; redirectTo?: string }
  | { ok: false; error: string }
> {
  const result = await authenticateUser({
    email: input.email,
    password: input.password,
  });

  if (!result.ok) {
    return result;
  }

  if (input.expectedRole && result.user.rol !== input.expectedRole) {
    const label =
      input.expectedRole === "desarrollador" ? "desarrollador" : "comprador";
    return {
      ok: false,
      error: `Esta cuenta no es de ${label}. Usa el modo de acceso correcto o regístrate.`,
    };
  }

  await setSessionCookie({
    sub: result.user.id,
    email: result.user.email,
    nombre: result.user.nombre,
    rol: result.user.rol,
  });

  revalidatePath("/", "layout");
  revalidatePath("/developer/dashboard");

  const user: SessionUserDto = {
    id: result.user.id,
    name: result.user.nombre,
    email: result.user.email,
    role: result.user.rol,
  };

  const redirectTo =
    result.user.rol === "desarrollador" ? "/developer/dashboard" : undefined;

  return { ok: true, user, redirectTo };
}

export async function registerAction(input: {
  email: string;
  password: string;
  nombre: string;
  accountType: "buyer" | "developer";
  companyName?: string;
}): Promise<
  | { ok: true; user: SessionUserDto; redirectTo?: string }
  | { ok: false; error: string }
> {
  const rol: RolUsuario =
    input.accountType === "developer"
      ? "desarrollador"
      : "empresa";

  const nombre =
    input.accountType === "developer"
      ? input.nombre.trim()
      : input.companyName?.trim() || input.nombre.trim();

  const registerInput: RegisterInput = {
    email: input.email,
    password: input.password,
    nombre,
    rol,
  };

  const result = await registerUser(registerInput);
  if (!result.ok) {
    return result;
  }

  await setSessionCookie({
    sub: result.user.id,
    email: result.user.email,
    nombre: result.user.nombre,
    rol: result.user.rol,
  });

  revalidatePath("/", "layout");
  revalidatePath("/developer/dashboard");

  const user: SessionUserDto = {
    id: result.user.id,
    name: result.user.nombre,
    email: result.user.email,
    role: result.user.rol,
  };

  const redirectTo =
    result.user.rol === "desarrollador" ? "/developer/dashboard" : undefined;

  return { ok: true, user, redirectTo };
}

export async function oauthLoginAction(input: {
  provider: OAuthProvider;
  accountType: OAuthAccountType;
}): Promise<
  | { ok: true; user: SessionUserDto; redirectTo?: string }
  | { ok: false; error: string }
> {
  try {
    const user = await resolveOAuthDemoUser(input.provider, input.accountType);

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    });

    revalidatePath("/", "layout");
    revalidatePath("/developer/dashboard");

    const sessionUser: SessionUserDto = {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: user.rol,
    };

    const redirectTo =
      user.rol === "desarrollador" ? "/developer/dashboard" : undefined;

    return { ok: true, user: sessionUser, redirectTo };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error en autenticación social.";
    return { ok: false, error: detail };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  revalidatePath("/developer/dashboard");
}

export async function loginAndRedirectAction(input: {
  email: string;
  password: string;
  expectedRole?: RolUsuario;
}): Promise<{ ok: false; error: string } | undefined> {
  const result = await loginAction(input);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  if (result.redirectTo) {
    redirect(result.redirectTo);
  }
}

export async function registerAndRedirectAction(input: {
  email: string;
  password: string;
  nombre: string;
  accountType: "buyer" | "developer";
  companyName?: string;
}): Promise<{ ok: false; error: string } | undefined> {
  const result = await registerAction(input);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  if (result.redirectTo) {
    redirect(result.redirectTo);
  }
}
