"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

interface CodeBlockProps {
  code: string;
  label?: string;
  className?: string;
}

export function CodeBlock({ code, label, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-neutral-800/60 bg-neutral-950/80 ${className}`.trim()}
    >
      <div className="flex items-center justify-between border-b border-neutral-800/60 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          {label ?? "Comando"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400 transition hover:bg-white/[0.04] hover:text-neutral-200"
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={1.5} aria-hidden="true" />
              Copiado
            </>
          ) : (
            <>
              <Copy size={12} strokeWidth={1.5} aria-hidden="true" />
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-neutral-300">
        {code}
      </pre>
    </div>
  );
}
