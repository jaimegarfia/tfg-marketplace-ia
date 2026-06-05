import type { TipoActivo } from "@/types/database";

export const DEFAULT_FLOW_DESCRIPTOR = JSON.stringify(
  {
    workflow: {
      engine: "n8n",
      steps: [
        {
          id: "fetch-context",
          action: "fetch",
          endpoint: "https://api.example.com/context",
        },
        { id: "summarize", action: "llm.completion", model: "gpt-4o-mini" },
      ],
    },
  },
  null,
  2,
);

export const DEFAULT_MANIFEST_JSON = JSON.stringify(
  {
    env: {
      CERTIA_AGENT_ID: "",
      LOG_LEVEL: "info",
    },
    resources: {
      memory: "128m",
      cpus: "0.5",
    },
  },
  null,
  2,
);

export interface ParsedPublishConfigFields {
  flowDescriptor: string;
  imageRegistryUri: string;
  manifestJson: string;
}

export function parseStoredDescriptorToFields(
  tipoActivo: TipoActivo,
  descriptorTecnico: string | null | undefined,
): ParsedPublishConfigFields {
  if (!descriptorTecnico?.trim()) {
    return {
      flowDescriptor: DEFAULT_FLOW_DESCRIPTOR,
      imageRegistryUri: "",
      manifestJson: DEFAULT_MANIFEST_JSON,
    };
  }

  try {
    const parsed: unknown = JSON.parse(descriptorTecnico);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid");
    }

    if (tipoActivo === "runtime_artifact") {
      const record = parsed as Record<string, unknown>;
      const uri =
        typeof record.image_registry_uri === "string"
          ? record.image_registry_uri
          : "";
      const manifest =
        record.manifest && typeof record.manifest === "object"
          ? JSON.stringify(record.manifest, null, 2)
          : DEFAULT_MANIFEST_JSON;

      return {
        flowDescriptor: DEFAULT_FLOW_DESCRIPTOR,
        imageRegistryUri: uri,
        manifestJson: manifest,
      };
    }

    return {
      flowDescriptor: JSON.stringify(parsed, null, 2),
      imageRegistryUri: "",
      manifestJson: DEFAULT_MANIFEST_JSON,
    };
  } catch {
    if (tipoActivo === "reference_architecture") {
      return {
        flowDescriptor: descriptorTecnico.trim(),
        imageRegistryUri: "",
        manifestJson: DEFAULT_MANIFEST_JSON,
      };
    }

    return {
      flowDescriptor: DEFAULT_FLOW_DESCRIPTOR,
      imageRegistryUri: "",
      manifestJson: DEFAULT_MANIFEST_JSON,
    };
  }
}

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
