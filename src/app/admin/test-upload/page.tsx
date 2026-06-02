"use client";

import { FormEvent, useMemo, useState } from "react";

type TipoActivo = "runtime_artifact" | "reference_architecture";

interface FormState {
  nombre: string;
  version: string;
  precio_usd: string;
  tipo_activo: TipoActivo;
  descriptor_tecnico: string;
}

interface UploadAuditResult {
  agenteId: string;
  estadoAuditoria: string;
  resultadoGlobal: boolean;
  hashIntegridad: string;
  vulnerabilidadesDetectadas: number;
  logsSandbox: string;
  permisosAprobados: unknown;
  fechaEjecucion: string;
}

const INITIAL_STATE: FormState = {
  nombre: "",
  version: "1.0.0",
  precio_usd: "0",
  tipo_activo: "runtime_artifact",
  descriptor_tecnico: JSON.stringify(
    {
      workflow: {
        steps: [
          {
            id: "fetch-context",
            action: "fetch",
            endpoint: "https://api.example.com/context",
          },
        ],
      },
    },
    null,
    2,
  ),
};

export default function AdminTestUploadPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [auditResult, setAuditResult] = useState<UploadAuditResult | null>(null);

  const submitDisabled = useMemo(() => {
    return (
      isSubmitting ||
      !form.nombre.trim() ||
      !form.version.trim() ||
      !form.precio_usd.trim() ||
      !form.descriptor_tecnico.trim()
    );
  }, [form, isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setAuditResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/internal/test-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          version: form.version.trim(),
          precio_usd: Number(form.precio_usd),
          tipo_activo: form.tipo_activo,
          descriptor_tecnico: form.descriptor_tecnico,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        result?: UploadAuditResult;
        detail?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.detail ?? "No se pudo publicar el activo.");
      }

      setFeedback({
        type: data.result?.estadoAuditoria === "rechazado" ? "error" : "success",
        message: `Activo publicado. ID: ${data.result?.agenteId ?? "N/A"} · estado: ${data.result?.estadoAuditoria ?? "N/A"}`,
      });
      setAuditResult(data.result ?? null);
      setForm((prev) => ({ ...INITIAL_STATE, descriptor_tecnico: prev.descriptor_tecnico }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido al publicar.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0b0d10] px-6 py-12 text-neutral-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 border-b border-neutral-800/70 pb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Admin interno
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100">
            Carga de activos de prueba
          </h1>
          <p className="text-sm leading-relaxed text-neutral-400">
            Este flujo ejecuta la auditoría Docker real y persiste el resultado en
            Neon (`agentes` + `auditorias`) antes de publicar el activo.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-neutral-800/70 bg-black/30 p-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="nombre"
              className="font-mono text-xs uppercase tracking-widest text-neutral-500"
            >
              Nombre del activo
            </label>
            <input
              id="nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nombre: event.target.value }))
              }
              className="w-full rounded-lg border border-neutral-800 bg-[#0c0f13] px-3 py-2 text-sm text-neutral-200 outline-none transition focus:border-neutral-600"
              placeholder="Ej. Sentinel Runtime Guard"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="version"
                className="font-mono text-xs uppercase tracking-widest text-neutral-500"
              >
                Versión
              </label>
              <input
                id="version"
                value={form.version}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, version: event.target.value }))
                }
                className="w-full rounded-lg border border-neutral-800 bg-[#0c0f13] px-3 py-2 text-sm text-neutral-200 outline-none transition focus:border-neutral-600"
                placeholder="1.0.0"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="precio_usd"
                className="font-mono text-xs uppercase tracking-widest text-neutral-500"
              >
                Precio (USD)
              </label>
              <input
                id="precio_usd"
                type="number"
                min={0}
                step="0.01"
                value={form.precio_usd}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, precio_usd: event.target.value }))
                }
                className="w-full rounded-lg border border-neutral-800 bg-[#0c0f13] px-3 py-2 text-sm text-neutral-200 outline-none transition focus:border-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tipo_activo"
                className="font-mono text-xs uppercase tracking-widest text-neutral-500"
              >
                Tipo de activo
              </label>
              <select
                id="tipo_activo"
                value={form.tipo_activo}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    tipo_activo: event.target.value as TipoActivo,
                  }))
                }
                className="w-full rounded-lg border border-neutral-800 bg-[#0c0f13] px-3 py-2 text-sm text-neutral-200 outline-none transition focus:border-neutral-600"
              >
                <option value="runtime_artifact">runtime_artifact</option>
                <option value="reference_architecture">
                  reference_architecture
                </option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="descriptor"
              className="font-mono text-xs uppercase tracking-widest text-neutral-500"
            >
              Descriptor técnico (JSON del flujo)
            </label>
            <textarea
              id="descriptor"
              rows={12}
              value={form.descriptor_tecnico}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  descriptor_tecnico: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-neutral-800 bg-[#0c0f13] px-3 py-2 font-mono text-xs text-neutral-200 outline-none transition focus:border-neutral-600"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Auditando y publicando..." : "Publicar activo de prueba"}
          </button>

          {feedback && (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-red-400/20 bg-red-400/10 text-red-300"
              }`}
            >
              {feedback.message}
            </p>
          )}

          {auditResult && (
            <div className="space-y-4 rounded-lg border border-neutral-800/70 bg-[#0c0f13] p-4">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  Resultado de auditoría persistido
                </p>
                <p className="text-xs text-neutral-400">
                  Fecha: {new Date(auditResult.fechaEjecucion).toLocaleString()}
                </p>
              </div>

              {!auditResult.resultadoGlobal && (
                <p className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  Activo rechazado por el motor de auditoría. Revisa los logs para
                  el motivo exacto.
                </p>
              )}

              <div className="grid gap-2 text-xs text-neutral-300 sm:grid-cols-2">
                <p className="font-mono">
                  Resultado global:{" "}
                  <span
                    className={
                      auditResult.resultadoGlobal
                        ? "text-emerald-300"
                        : "text-red-300"
                    }
                  >
                    {auditResult.resultadoGlobal ? "PASS" : "FAIL"}
                  </span>
                </p>
                <p className="font-mono">
                  Vulnerabilidades: {auditResult.vulnerabilidadesDetectadas}
                </p>
                <p className="font-mono sm:col-span-2 break-all">
                  SHA-256: {auditResult.hashIntegridad}
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  Logs del sandbox
                </p>
                <pre className="max-h-64 overflow-auto rounded-md border border-neutral-800 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
                  {auditResult.logsSandbox}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  Permisos aprobados (JSONB)
                </p>
                <pre className="overflow-auto rounded-md border border-neutral-800 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
                  {JSON.stringify(auditResult.permisosAprobados, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
