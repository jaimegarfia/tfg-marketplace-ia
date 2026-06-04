import { query } from "@/lib/db";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import type { RolUsuario } from "@/types/database";

export interface AuthUserRecord {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

interface UserRow {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  password_hash: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  nombre: string;
  rol: RolUsuario;
  empresa?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegisterInput(
  input: RegisterInput,
): { ok: true } | { ok: false; error: string } {
  if (!input.nombre.trim()) {
    return { ok: false, error: "El nombre es obligatorio." };
  }
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, error: "Introduce un correo electrónico válido." };
  }
  const passwordCheck = validatePasswordStrength(input.password);
  if (!passwordCheck.ok) {
    return passwordCheck;
  }
  if (!["desarrollador", "empresa"].includes(input.rol)) {
    return { ok: false, error: "Tipo de cuenta no válido." };
  }
  return { ok: true };
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ ok: true; user: AuthUserRecord } | { ok: false; error: string }> {
  const validation = validateRegisterInput(input);
  if (!validation.ok) {
    return validation;
  }

  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  try {
    const empresa = input.empresa?.trim() || null;
    let rows: { id: string }[];

    try {
      rows = await query<{ id: string }>(
        `
          INSERT INTO usuarios (email, nombre, rol, avatar_url, password_hash, empresa)
          VALUES ($1, $2, $3, NULL, $4, $5)
          RETURNING id::text AS id
        `,
        [email, input.nombre.trim(), input.rol, passwordHash, empresa],
      );
    } catch (insertError) {
      const msg =
        insertError instanceof Error ? insertError.message : String(insertError);
      if (!msg.includes("empresa")) {
        throw insertError;
      }
      rows = await query<{ id: string }>(
        `
          INSERT INTO usuarios (email, nombre, rol, avatar_url, password_hash)
          VALUES ($1, $2, $3, NULL, $4)
          RETURNING id::text AS id
        `,
        [email, input.nombre.trim(), input.rol, passwordHash],
      );
    }

    const id = rows[0]?.id;
    if (!id) {
      return { ok: false, error: "No se pudo crear la cuenta." };
    }

    return {
      ok: true,
      user: {
        id,
        email,
        nombre: input.nombre.trim(),
        rol: input.rol,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("usuarios_email_key") || message.includes("duplicate")) {
      return {
        ok: false,
        error: "Ya existe una cuenta con este correo electrónico.",
      };
    }
    if (message.includes("password_hash")) {
      return {
        ok: false,
        error:
          "Falta la columna password_hash en Neon. Ejecuta scripts/migration-auth.sql.",
      };
    }
    throw error;
  }
}

export async function authenticateUser(
  input: LoginInput,
): Promise<{ ok: true; user: AuthUserRecord } | { ok: false; error: string }> {
  const email = normalizeEmail(input.email);
  if (!email || !input.password) {
    return { ok: false, error: "Introduce correo y contraseña." };
  }

  const rows = await query<UserRow>(
    `
      SELECT
        id::text AS id,
        email,
        nombre,
        rol,
        password_hash
      FROM usuarios
      WHERE LOWER(email) = $1
      LIMIT 1
    `,
    [email],
  );

  const row = rows[0];
  if (!row) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  if (!row.password_hash) {
    return {
      ok: false,
      error:
        "Esta cuenta aún no tiene contraseña. Regístrate de nuevo con otro email o contacta soporte.",
    };
  }

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  return {
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      nombre: row.nombre,
      rol: row.rol,
    },
  };
}

export async function getUserById(
  userId: string,
): Promise<AuthUserRecord | null> {
  const rows = await query<AuthUserRecord>(
    `
      SELECT id::text AS id, email, nombre, rol
      FROM usuarios
      WHERE id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
}
