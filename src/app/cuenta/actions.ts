"use server";

import { revalidatePath } from "next/cache";
import {
  deleteUserAccount,
  getUserProfile,
  updateUserProfile,
} from "@/lib/auth/account-service";
import {
  clearSessionCookie,
  getSessionFromCookies,
  setSessionCookie,
} from "@/lib/auth/session";

export async function getAccountProfileAction() {
  const session = await getSessionFromCookies();
  if (!session) return null;

  try {
    return await getUserProfile(session.sub);
  } catch {
    return {
      id: session.sub,
      email: session.email,
      nombre: session.nombre,
      rol: session.rol,
      empresa: null,
    };
  }
}

export async function updateAccountProfileAction(input: {
  nombre: string;
  empresa?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSessionFromCookies();
  if (!session) {
    return { ok: false, error: "Sesión no encontrada." };
  }

  try {
    const updated = await updateUserProfile(session.sub, {
      nombre: input.nombre,
      empresa: input.empresa,
    });

    await setSessionCookie({
      sub: updated.id,
      email: updated.email,
      nombre: updated.nombre,
      rol: updated.rol,
    });

    revalidatePath("/", "layout");
    revalidatePath("/cuenta");
    revalidatePath("/developer/dashboard");

    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error al guardar el perfil.";
    return { ok: false, error: detail };
  }
}

export async function deleteAccountAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await getSessionFromCookies();
  if (!session) {
    return { ok: false, error: "Sesión no encontrada." };
  }

  try {
    await deleteUserAccount(session.sub);
    await clearSessionCookie();
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "No se pudo eliminar la cuenta.";
    return { ok: false, error: detail };
  }
}
