"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getSessionFromCookies,
  clearSessionCookie,
  setSessionCookie,
} from "@/lib/auth/session";
import { authenticateUser } from "@/lib/auth/user-service";
import {
  getDeveloperDashboardData,
  resolveDeveloperById,
  updateFineTuningEstadoForDeveloper,
  type DeveloperDashboardData,
} from "@/lib/developer-dashboard";
import {
  getDeveloperAssetDetail,
  submitDeveloperAssetVersion,
  updateDeveloperAsset,
  validateUpdateAssetInput,
  validateVersionInput,
  type DeveloperAssetDetail,
  type SubmitVersionResult,
  type UpdateAssetInput,
  type SubmitVersionInput,
} from "@/lib/developer-asset";
import {
  saveDeveloperCatalogDetails,
  validateCatalogDetailsInput,
} from "@/lib/developer-catalog-details";
import {
  publishDeveloperAsset,
  validatePublishInput,
  type PublishAssetResult,
} from "@/lib/developer-publish";
import type { AssetVisualIconId } from "@/lib/asset-visual-icons";
import type {
  CategoriaAgente,
  EstadoProcesoFineTuning,
  TipoActivo,
} from "@/types/database";

const VALID_ESTADOS: ReadonlySet<EstadoProcesoFineTuning> = new Set([
  "solicitado",
  "en_desarrollo",
  "entregado",
  "disputa",
]);

export async function clearDeveloperSession(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/developer/dashboard");
}

export async function getDeveloperDashboardFromSession(): Promise<DeveloperDashboardData | null> {
  const session = await getSessionFromCookies();
  if (!session || session.rol !== "desarrollador") {
    return null;
  }

  const developer = await resolveDeveloperById(session.sub);
  if (!developer) {
    await clearSessionCookie();
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
  precioEur: number;
  tipoActivo: TipoActivo;
  categoria: CategoriaAgente;
  descripcion: string;
  descriptorTecnico: string;
  imagenUrl: string;
  estudioComercial?: string | null;
  admiteAdaptacion: boolean;
}

export interface SaveCatalogDetailsActionInput {
  agenteId: string;
  guiaDespliegue: string;
  admiteAdaptacion: boolean;
}

export async function publishAssetAction(
  input: PublishAssetActionInput,
): Promise<
  { ok: true; result: PublishAssetResult } | { ok: false; error: string }
> {
  const session = await resolveSessionDeveloper();
  if (!session.ok) {
    return session;
  }

  const validation = validatePublishInput({
    nombre: input.nombre,
    version: input.version,
    precioEur: input.precioEur,
    tipoActivo: input.tipoActivo,
    categoria: input.categoria,
    descripcion: input.descripcion,
    descriptorTecnico: input.descriptorTecnico,
    imagenUrl: input.imagenUrl,
    estudioComercial: input.estudioComercial,
    admiteAdaptacion: input.admiteAdaptacion,
  });

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  try {
    const result = await publishDeveloperAsset({
      developerId: session.developer.id,
      nombre: input.nombre,
      version: input.version,
      precioEur: input.precioEur,
      tipoActivo: input.tipoActivo,
      categoria: input.categoria,
      descripcion: input.descripcion,
      descriptorTecnico: input.descriptorTecnico,
      imagenUrl: input.imagenUrl as AssetVisualIconId,
      estudioComercial: input.estudioComercial,
      admiteAdaptacion: input.admiteAdaptacion,
    });

    revalidatePath("/developer/dashboard");
    revalidatePath("/");
    return { ok: true, result };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido al publicar.";
    return { ok: false, error: detail };
  }
}

export async function saveAssetCatalogDetailsAction(
  input: SaveCatalogDetailsActionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await resolveSessionDeveloper();
  if (!session.ok) {
    return session;
  }

  const validation = validateCatalogDetailsInput({
    guiaDespliegue: input.guiaDespliegue,
    admiteAdaptacion: input.admiteAdaptacion,
  });
  if (!validation.ok) {
    return validation;
  }

  try {
    const updated = await saveDeveloperCatalogDetails({
      developerId: session.developer.id,
      agenteId: input.agenteId,
      guiaDespliegue: input.guiaDespliegue,
      admiteAdaptacion: input.admiteAdaptacion,
    });
    if (!updated) {
      return {
        ok: false,
        error:
          "No se encontró el activo certificado o no tienes permiso para editarlo.",
      };
    }
    revalidatePath("/developer/dashboard");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error al guardar la guía.";
    return { ok: false, error: detail };
  }
}

async function resolveSessionDeveloper(): Promise<
  | { ok: true; developer: { id: string; email: string; nombre: string } }
  | { ok: false; error: string }
> {
  const session = await getSessionFromCookies();
  if (!session) {
    return { ok: false, error: "Sesión no encontrada. Inicia sesión." };
  }

  if (session.rol !== "desarrollador") {
    return { ok: false, error: "Esta cuenta no tiene rol de desarrollador." };
  }

  const developer = await resolveDeveloperById(session.sub);
  if (!developer) {
    return { ok: false, error: "Desarrollador no autorizado." };
  }

  return { ok: true, developer };
}

export async function developerGateLoginAction(input: {
  email: string;
  password: string;
}): Promise<{ ok: false; error: string } | undefined> {
  const result = await authenticateUser(input);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (result.user.rol !== "desarrollador") {
    return {
      ok: false,
      error: "Esta cuenta no es de desarrollador. Regístrate como vendedor.",
    };
  }

  await setSessionCookie({
    sub: result.user.id,
    email: result.user.email,
    nombre: result.user.nombre,
    rol: result.user.rol,
  });

  revalidatePath("/developer/dashboard");
  redirect("/developer/dashboard");
}

export async function getAssetDetailAction(
  agenteId: string,
): Promise<
  { ok: true; detail: DeveloperAssetDetail } | { ok: false; error: string }
> {
  const session = await resolveSessionDeveloper();
  if (!session.ok) return session;

  try {
    const detail = await getDeveloperAssetDetail(
      session.developer.id,
      agenteId,
    );
    if (!detail) {
      return { ok: false, error: "Activo no encontrado o sin permisos." };
    }
    return { ok: true, detail };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error al cargar el activo.";
    return { ok: false, error: detail };
  }
}

export async function updateAssetAction(
  agenteId: string,
  input: UpdateAssetInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await resolveSessionDeveloper();
  if (!session.ok) return session;

  const validation = validateUpdateAssetInput(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  try {
    const updated = await updateDeveloperAsset(
      session.developer.id,
      agenteId,
      input,
    );
    if (!updated) {
      return { ok: false, error: "Activo no encontrado o sin permisos." };
    }
    revalidatePath("/developer/dashboard");
    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error al actualizar el activo.";
    return { ok: false, error: detail };
  }
}

export async function submitAssetVersionAction(
  agenteId: string,
  input: SubmitVersionInput,
): Promise<
  { ok: true; result: SubmitVersionResult } | { ok: false; error: string }
> {
  const session = await resolveSessionDeveloper();
  if (!session.ok) return session;

  const validation = validateVersionInput(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  try {
    const result = await submitDeveloperAssetVersion(
      session.developer.id,
      agenteId,
      input,
    );
    if (!result) {
      return { ok: false, error: "Activo no encontrado o sin permisos." };
    }
    revalidatePath("/developer/dashboard");
    return { ok: true, result };
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error al publicar la versión.";
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

  const session = await resolveSessionDeveloper();
  if (!session.ok) {
    return session;
  }

  try {
    const updated = await updateFineTuningEstadoForDeveloper(
      servicioId,
      estado,
      session.developer.id,
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
