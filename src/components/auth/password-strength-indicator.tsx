"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { analyzePasswordStrength } from "@/lib/auth/password-policy";
import type { PasswordStrengthLevel } from "@/lib/auth/password-policy";

interface PasswordStrengthIndicatorProps {
  password: string;
  id?: string;
  variant?: "default" | "compact";
}

const BAR_COLORS: Record<
  Exclude<PasswordStrengthLevel, "empty">,
  string
> = {
  weak: "bg-red-500/90",
  fair: "bg-amber-400/90",
  good: "bg-emerald-500/85",
  strong: "bg-emerald-400",
};

const LABEL_COLORS: Record<
  Exclude<PasswordStrengthLevel, "empty">,
  string
> = {
  weak: "text-red-300/90",
  fair: "text-amber-300/90",
  good: "text-emerald-300/90",
  strong: "text-emerald-300",
};

export function PasswordStrengthIndicator({
  password,
  id = "password-strength",
  variant = "default",
}: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(
    () => analyzePasswordStrength(password),
    [password],
  );

  const showLevel = password.length > 0 && analysis.level !== "empty";
  const barLevel = analysis.level === "empty" ? "weak" : analysis.level;

  if (variant === "compact") {
    return (
      <div id={id} className="space-y-1.5" aria-live="polite">
        <div className="flex items-center gap-2">
          <div
            className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={analysis.barPercent}
            aria-label={
              showLevel
                ? `Nivel de seguridad: ${analysis.levelLabel}`
                : "Nivel de seguridad"
            }
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                password ? BAR_COLORS[barLevel] : "bg-zinc-700"
              }`}
              style={{ width: `${analysis.barPercent}%` }}
            />
          </div>
          {showLevel && (
            <span
              className={`shrink-0 text-[10px] font-medium ${LABEL_COLORS[barLevel]}`}
            >
              {analysis.levelLabel}
            </span>
          )}
        </div>
        <ul
          className="grid grid-cols-2 gap-x-2 gap-y-0.5"
          aria-label="Requisitos de contraseña"
        >
          {analysis.requirements.map((req) => (
            <li
              key={req.id}
              className={`flex items-center gap-1 text-[10px] leading-tight ${
                req.met ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              <span
                className={`inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
                  req.met
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700"
                }`}
                aria-hidden="true"
              >
                {req.met && <Check size={8} strokeWidth={2.5} />}
              </span>
              <span className="truncate">{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="space-y-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Seguridad de la contraseña
        </span>
        {showLevel && (
          <span
            className={`text-[11px] font-medium ${LABEL_COLORS[barLevel]}`}
          >
            {analysis.levelLabel}
          </span>
        )}
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={analysis.barPercent}
        aria-label={
          showLevel
            ? `Nivel de seguridad: ${analysis.levelLabel}`
            : "Nivel de seguridad"
        }
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            password ? BAR_COLORS[barLevel] : "bg-zinc-700"
          }`}
          style={{ width: `${analysis.barPercent}%` }}
        />
      </div>

      <ul className="space-y-1" aria-label="Requisitos de contraseña">
        {analysis.requirements.map((req) => (
          <li
            key={req.id}
            className={`flex items-center gap-2 text-[11px] leading-snug transition-colors ${
              req.met ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            <span
              className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                req.met
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-zinc-700 bg-zinc-900/80"
              }`}
              aria-hidden="true"
            >
              {req.met && <Check size={9} strokeWidth={2.5} />}
            </span>
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
