import type { TipoActivo } from "@/types/database";

export function formatJsonString(text: string): string {
  return JSON.stringify(JSON.parse(text), null, 2);
}

export function parseJsonOrThrow(
  text: string,
  label: string,
): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`${label} no puede estar vacío.`);
  }
  const parsed: unknown = JSON.parse(trimmed);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} debe ser un objeto JSON.`);
  }
  return parsed as Record<string, unknown>;
}

export interface PublishConfigFields {
  tipoActivo: TipoActivo;
  flowDescriptor: string;
  imageRegistryUri: string;
  manifestJson: string;
}

export function buildDescriptorTecnico(
  fields: PublishConfigFields,
): string {
  if (fields.tipoActivo === "reference_architecture") {
    return fields.flowDescriptor.trim();
  }
  const manifest = parseJsonOrThrow(
    fields.manifestJson,
    "El manifiesto del contenedor",
  );
  return JSON.stringify(
    {
      image_registry_uri: fields.imageRegistryUri.trim(),
      manifest,
    },
    null,
    2,
  );
}

export function validatePublishConfig(
  fields: PublishConfigFields,
): { ok: true; descriptorTecnico: string } | { ok: false; error: string } {
  if (fields.tipoActivo === "reference_architecture") {
    try {
      parseJsonOrThrow(fields.flowDescriptor, "El flujo declarativo");
    } catch (cause) {
      return {
        ok: false,
        error:
          cause instanceof Error
            ? cause.message
            : "El flujo declarativo debe ser un JSON válido.",
      };
    }
  } else {
    if (!fields.imageRegistryUri.trim()) {
      return {
        ok: false,
        error: "La ruta del registro de imagen (Image Registry URI) es obligatoria.",
      };
    }
    try {
      parseJsonOrThrow(fields.manifestJson, "El manifiesto del contenedor");
    } catch (cause) {
      return {
        ok: false,
        error:
          cause instanceof Error
            ? cause.message
            : "El manifiesto debe ser un JSON válido.",
      };
    }
  }

  try {
    const descriptorTecnico = buildDescriptorTecnico(fields);
    JSON.parse(descriptorTecnico);
    return { ok: true, descriptorTecnico };
  } catch (cause) {
    return {
      ok: false,
      error:
        cause instanceof Error
          ? cause.message
          : "No se pudo construir el descriptor técnico.",
    };
  }
}
