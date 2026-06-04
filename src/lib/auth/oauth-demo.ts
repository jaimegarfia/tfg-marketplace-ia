import { query } from "@/lib/db";
import type { RolUsuario } from "@/types/database";
import type { AuthUserRecord } from "@/lib/auth/user-service";

export type OAuthProvider = "google" | "apple";
export type OAuthAccountType = "buyer" | "developer";

interface OAuthProfile {
  email: string;
  nombre: string;
  rol: RolUsuario;
}

const OAUTH_PROFILES: Record<
  OAuthProvider,
  Record<OAuthAccountType, OAuthProfile>
> = {
  google: {
    buyer: {
      email: "comprador.google@certia.demo",
      nombre: "Usuario Google",
      rol: "empresa",
    },
    developer: {
      email: "dev.google@certia.demo",
      nombre: "Certia Labs (Google)",
      rol: "desarrollador",
    },
  },
  apple: {
    buyer: {
      email: "comprador.apple@certia.demo",
      nombre: "Usuario Apple",
      rol: "empresa",
    },
    developer: {
      email: "dev.apple@certia.demo",
      nombre: "Certia Labs (Apple)",
      rol: "desarrollador",
    },
  },
};

export function getOAuthProfile(
  provider: OAuthProvider,
  accountType: OAuthAccountType,
): OAuthProfile {
  return OAUTH_PROFILES[provider][accountType];
}

/**
 * Inicio de sesión OAuth de demostración: crea el usuario en Neon si no existe
 * y devuelve la fila para abrir sesión (sin contraseña; flujo sin password_hash).
 * Sustituir por Google/Apple OAuth real cuando haya Client ID en producción.
 */
export async function resolveOAuthDemoUser(
  provider: OAuthProvider,
  accountType: OAuthAccountType,
): Promise<AuthUserRecord> {
  const profile = getOAuthProfile(provider, accountType);

  const existing = await query<AuthUserRecord>(
    `
      SELECT id::text AS id, email, nombre, rol
      FROM usuarios
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [profile.email],
  );

  if (existing[0]) {
    return existing[0];
  }

  const created = await query<AuthUserRecord>(
    `
      INSERT INTO usuarios (email, nombre, rol, avatar_url, password_hash)
      VALUES ($1, $2, $3, NULL, NULL)
      RETURNING id::text AS id, email, nombre, rol
    `,
    [profile.email, profile.nombre, profile.rol],
  );

  const user = created[0];
  if (!user) {
    throw new Error("No se pudo registrar la cuenta OAuth de demostración.");
  }

  return user;
}
