"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { CheckCircle2, FileJson, Upload, X } from "lucide-react";
import type { TipoActivo } from "@/types/database";
import { formatJsonString } from "@/lib/publish-descriptor";

const ACCEPT_FLOW = ".json,.yaml,.yml,application/json,text/yaml,text/x-yaml";

interface IdePanelProps {
  tabLabel: string;
  formatLabel?: string;
  onFormat?: () => void;
  formatDisabled?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
}

function IdePanel({
  tabLabel,
  formatLabel,
  onFormat,
  formatDisabled,
  children,
  footer,
  compact,
}: IdePanelProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/90 bg-black shadow-inner">
      <div className="flex items-center gap-0 border-b border-zinc-800/80 bg-zinc-900 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          <span
            className="shrink-0 rounded-t border border-b-0 border-zinc-700/80 bg-zinc-950 px-2.5 py-1 font-mono text-[10px] text-neutral-300"
            aria-hidden="true"
          >
            {tabLabel}
          </span>
          <span className="hidden shrink-0 rounded-t px-2.5 py-1 font-mono text-[10px] text-neutral-600 sm:inline">
            preview
          </span>
        </div>
        {formatLabel && onFormat && (
          <button
            type="button"
            disabled={formatDisabled}
            onClick={onFormat}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-950/80 px-2 py-1 font-mono text-[10px] text-neutral-400 transition hover:border-emerald-500/40 hover:text-emerald-300/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {formatLabel}
          </button>
        )}
      </div>
      <div className={compact ? "p-0" : "p-0"}>{children}</div>
      {footer && (
        <p className="border-t border-zinc-900/80 px-3 py-2 text-[11px] leading-relaxed text-neutral-600">
          {footer}
        </p>
      )}
    </div>
  );
}

interface FlowDeclarativeBlockProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onSyntaxError: (message: string) => void;
  onClearSyntaxError?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FlowDeclarativeBlock({
  value,
  onChange,
  disabled,
  onSyntaxError,
  onClearSyntaxError,
}: FlowDeclarativeBlockProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const ingestFile = useCallback(
    async (file: File) => {
      const name = file.name.toLowerCase();
      const text = await file.text();
      setUploadedFile({ name: file.name, size: file.size });

      if (name.endsWith(".json")) {
        try {
          onChange(formatJsonString(text));
          onClearSyntaxError?.();
          return;
        } catch {
          onSyntaxError(
            "El archivo JSON tiene errores de sintaxis. Revísalo en el editor.",
          );
          onChange(text);
          return;
        }
      }
      onChange(text);
      onClearSyntaxError?.();
    },
    [onChange, onClearSyntaxError, onSyntaxError],
  );

  const handleFormat = () => {
    try {
      onChange(formatJsonString(value));
      onClearSyntaxError?.();
    } catch {
      onSyntaxError("Error de sintaxis: el JSON no es válido.");
    }
  };

  const handleEditorChange = (next: string) => {
    onChange(next);
    onClearSyntaxError?.();
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files[0];
    if (file) await ingestFile(file);
  };

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        Carga de flujo declarativo
      </p>

      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept={ACCEPT_FLOW}
        className="sr-only"
        disabled={disabled}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await ingestFile(file);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !disabled && fileRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors
          ${
            isDragging
              ? "border-emerald-500/70 bg-emerald-500/5"
              : "border-zinc-700 bg-neutral-950/40 hover:border-emerald-500"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        <Upload
          size={22}
          strokeWidth={1.5}
          className="text-neutral-500"
          aria-hidden="true"
        />
        <p className="max-w-md text-sm text-neutral-400">
          Arrastra aquí tu archivo de flujo (.json, .yaml) o haz clic para
          buscarlo
        </p>
        <FileJson
          size={16}
          className="text-neutral-600"
          aria-hidden="true"
        />
        {!uploadedFile && (
          <p className="text-[11px] text-neutral-600">
            El contenido aparecerá en el editor inferior.
          </p>
        )}
      </div>

      {uploadedFile && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5"
          role="status"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2
              size={16}
              className="shrink-0 text-emerald-400/90"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-emerald-200/90">
                Archivo cargado: {uploadedFile.name}
              </p>
              <p className="text-[11px] text-neutral-500">
                {formatFileSize(uploadedFile.size)} · contenido en el editor
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              clearUploadedFile();
            }}
            className="shrink-0 rounded-md p-1 text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-300 disabled:opacity-50"
            aria-label="Quitar referencia del archivo"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <IdePanel
        tabLabel="descriptor_flujo.json"
        formatLabel="Formatear JSON"
        onFormat={handleFormat}
        formatDisabled={disabled}
        footer="El análisis perimetral escanea este descriptor: red, filesystem o código dinámico incrementan la superficie de riesgo."
      >
        <textarea
          value={value}
          disabled={disabled}
          spellCheck={false}
          rows={14}
          onChange={(event) => handleEditorChange(event.target.value)}
          className="ide-scroll min-h-[280px] w-full resize-y border-0 bg-black px-3 py-3 font-mono text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-700 focus:ring-0"
          placeholder='{ "workflow": { "engine": "n8n", "steps": [] } }'
        />
      </IdePanel>
    </div>
  );
}

interface RuntimeContainerBlockProps {
  imageRegistryUri: string;
  onImageRegistryUriChange: (value: string) => void;
  manifestJson: string;
  onManifestJsonChange: (value: string) => void;
  disabled?: boolean;
  onSyntaxError: (message: string) => void;
  onClearSyntaxError?: () => void;
}

export function RuntimeContainerBlock({
  imageRegistryUri,
  onImageRegistryUriChange,
  manifestJson,
  onManifestJsonChange,
  disabled,
  onSyntaxError,
  onClearSyntaxError,
}: RuntimeContainerBlockProps) {
  const handleFormatManifest = () => {
    try {
      onManifestJsonChange(formatJsonString(manifestJson));
      onClearSyntaxError?.();
    } catch {
      onSyntaxError("Error de sintaxis: el manifiesto JSON no es válido.");
    }
  };

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        Configuración de contenedor
      </p>

      <div className="space-y-1.5">
        <label htmlFor="pub-image-uri" className="block text-sm text-neutral-300">
          Ruta del Registro de Imagen (Image Registry URI)
        </label>
        <input
          id="pub-image-uri"
          type="text"
          value={imageRegistryUri}
          disabled={disabled}
          onChange={(event) => onImageRegistryUriChange(event.target.value)}
          placeholder="ej: registry.certia.internal/secure-agent:v1.0.0"
          className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/70 px-3 py-2.5 font-mono text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-neutral-300">
          Configuración de Manifiesto y Variables de Entorno por Defecto (JSON)
        </p>
        <IdePanel
          tabLabel="manifest.json"
          formatLabel="Formatear JSON"
          onFormat={handleFormatManifest}
          formatDisabled={disabled}
          compact
          footer="Declara variables de entorno, límites de recursos y puertos expuestos. El sandbox validará permisos implícitos."
        >
          <textarea
            value={manifestJson}
            disabled={disabled}
            spellCheck={false}
            rows={8}
            onChange={(event) => {
              onManifestJsonChange(event.target.value);
              onClearSyntaxError?.();
            }}
            className="ide-scroll min-h-[160px] w-full resize-y border-0 bg-black px-3 py-3 font-mono text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-700 focus:ring-0"
            placeholder='{ "env": { "LOG_LEVEL": "info" }, "resources": { "memory": "128m" } }'
          />
        </IdePanel>
      </div>
    </div>
  );
}

interface PublishConfigByTipoProps {
  tipoActivo: TipoActivo;
  flowDescriptor: string;
  onFlowDescriptorChange: (value: string) => void;
  imageRegistryUri: string;
  onImageRegistryUriChange: (value: string) => void;
  manifestJson: string;
  onManifestJsonChange: (value: string) => void;
  disabled?: boolean;
  onSyntaxError: (message: string) => void;
  onClearSyntaxError?: () => void;
}

export function PublishConfigByTipo({
  tipoActivo,
  flowDescriptor,
  onFlowDescriptorChange,
  imageRegistryUri,
  onImageRegistryUriChange,
  manifestJson,
  onManifestJsonChange,
  disabled,
  onSyntaxError,
  onClearSyntaxError,
}: PublishConfigByTipoProps) {
  if (tipoActivo === "reference_architecture") {
    return (
      <FlowDeclarativeBlock
        value={flowDescriptor}
        onChange={onFlowDescriptorChange}
        disabled={disabled}
        onSyntaxError={onSyntaxError}
        onClearSyntaxError={onClearSyntaxError}
      />
    );
  }

  return (
    <RuntimeContainerBlock
      imageRegistryUri={imageRegistryUri}
      onImageRegistryUriChange={onImageRegistryUriChange}
      manifestJson={manifestJson}
      onManifestJsonChange={onManifestJsonChange}
      disabled={disabled}
      onSyntaxError={onSyntaxError}
      onClearSyntaxError={onClearSyntaxError}
    />
  );
}
