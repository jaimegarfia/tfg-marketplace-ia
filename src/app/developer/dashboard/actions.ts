"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getDeveloperDashboardData,
  resolveDeveloperByEmail,
  updateFineTuningEstadoForDeveloper,
  type DeveloperDashboardData,
} from "@/lib/developer-dashboard";
import {
  publishDeveloperAsset,
  validatePublishInput,
  type PublishAssetResult,
} from "@/lib/developer-publish";
import type {
  CategoriaAgente,
  EstadoProcesoFineTuning,
  TipoActivo,
} from "@/types/database";

const DEVELOPER_COOKIE = "certia_developer_email";

const VALID_ESTADOS: ReadonlySet<EstadoProcesoFineTuning> = new Set([
  "solicitado",
  "en_desarrollo",
  "entregado",
  "disputa",
]);

export async function establishDeveloperSession(
  email: string,
): Promise<{ ok: false; error: string } | undefined> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    return { ok: false, error: "Introduce un email de desarrollador." };
  }

  const developer = await resolveDeveloperByEmail(normalizedEmail);
  if (!developer) {
    return {
      ok: false,
      error:
        "Esta cuenta no tiene perfil de desarrollador en Neon. Ejecuta el seed del catálogo y usa un email como labs@certia.local.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(DEVELOPER_COOKIE, developer.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/developer/dashboard");
}

export async function clearDeveloperSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEVELOPER_COOKIE);
  revalidatePath("/developer/dashboard");
}

export async function getDeveloperDashboardFromSession(): Promise<DeveloperDashboardData | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get(DEVELOPER_COOKIE)?.value;
  if (!email) return null;

  const developer = await resolveDeveloperByEmail(email);
  if (!developer) {
    cookieStore.delete(DEVELOPER_COOKIE);
    return null;
  }

  try {
    const payload = await getDeveloperDashboardData(developer.id);

    return {
      developer,
      metrics: payload.metrics,
      agentes: payload.agentes,
      fineTuningRequests: payload.fineTuningRequests,
    };
  } catch (error) {
    console.error("[developer-dashboard] Error cargando datos.", error);
    return null;
  }
}

export interface PublishAssetActionInput {
  nombre: string;
  version: string;
  precioUsd: number;
  tipoActivo: TipoActivo;
  categoria: CategoriaAgente;
  descripcion: string;
  descriptorTecnico: string;
}

export async function publishAssetAction(
  input: PublishAssetActionInput,
): Promise<
  { ok: true; result: PublishAssetResult } | { ok: false; error: string }
> {
  const cookieStore = await cookies();
  const email = cookieStore.get(DEVELOPER_COOKIE)?.value;
  if (!email) {
    return { ok: false, error: "Sesión de desarrollador no encontrada." };
  }

  const developer = await resolveDeveloperByEmail(email);
  if (!developer) {
    return { ok: false, error: "Desarrollador no autorizado." };
  }

  const validation = validatePublishInput({
    nombre: input.nombre,
    version: input.version,
    precioUsd: input.precioUsd,
    tipoActivo: input.tipoActivo,
    categoria: input.categoria,
    descripcion: input.descripcion,
    descriptorTecnico: input.descriptorTecnico,
  });

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  try {
    const result = await publishDeveloperAsset({
      developerId: developer.id,
      nombre: input.nombre,
      version: input.version,
      precioUsd: input.precioUsd,
      tipoActivo: input.tipoActivo,
      categoria: input.categoria,
      descripcion: input.descripcion,
      descriptorTecnico: input.descriptorTecnico,
    });

    revalidatePath("/developer/dashboard");
    return { ok: true, result };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido al publicar.";
    return { ok: false, error: detail };
  }
}

export async function updateFineTuningEstadoAction(
  servicioId: string,
  estado: EstadoProcesoFineTuning,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!VALID_ESTADOS.has(estado)) {
    return { ok: false, error: "Estado de proceso no válido." };
  }

  const cookieStore = await cookies();
  const email = cookieStore.get(DEVELOPER_COOKIE)?.value;
  if (!email) {
    return { ok: false, error: "Sesión de desarrollador no encontrada." };
  }

  const developer = await resolveDeveloperByEmail(email);
  if (!developer) {
    return { ok: false, error: "Desarrollador no autorizado." };
  }

  try {
    const updated = await updateFineTuningEstadoForDeveloper(
      servicioId,
      estado,
      developer.id,
    );

    if (!updated) {
      return {
        ok: false,
        error: "No se encontró la solicitud o no pertenece a tu catálogo.",
      };
    }

    revalidatePath("/developer/dashboard");
    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido.";
    return { ok: false, error: detail };
  }
}
