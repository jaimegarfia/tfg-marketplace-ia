export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRequirementId =
  | "minLength"
  | "lowercase"
  | "uppercase"
  | "digit";

export const PASSWORD_REQUIREMENTS: {
  id: PasswordRequirementId;
  label: string;
}[] = [
  { id: "minLength", label: "Al menos 8 caracteres" },
  { id: "lowercase", label: "Una letra minúscula" },
  { id: "uppercase", label: "Una letra mayúscula" },
  { id: "digit", label: "Un número" },
];

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

export interface PasswordRequirementStatus {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
}

export interface PasswordStrengthAnalysis {
  level: PasswordStrengthLevel;
  levelLabel: string;
  barPercent: number;
  requirements: PasswordRequirementStatus[];
  isValid: boolean;
}

function checkRequirement(
  id: PasswordRequirementId,
  password: string,
): boolean {
  switch (id) {
    case "minLength":
      return password.length >= PASSWORD_MIN_LENGTH;
    case "lowercase":
      return /[a-záéíóúñü]/.test(password);
    case "uppercase":
      return /[A-ZÁÉÍÓÚÑÜ]/.test(password);
    case "digit":
      return /\d/.test(password);
    default:
      return false;
  }
}

function resolveLevel(
  password: string,
  requirementsMet: number,
): PasswordStrengthLevel {
  if (!password) return "empty";
  if (requirementsMet < PASSWORD_REQUIREMENTS.length) return "weak";

  const hasExtraLength = password.length >= 12;
  const hasSymbol = /[^A-Za-z0-9áéíóúñüÁÉÍÓÚÑÜ]/.test(password);

  if (hasExtraLength && hasSymbol) return "strong";
  if (hasExtraLength) return "good";
  return "fair";
}

const LEVEL_LABELS: Record<Exclude<PasswordStrengthLevel, "empty">, string> = {
  weak: "Débil",
  fair: "Aceptable",
  good: "Buena",
  strong: "Fuerte",
};

export function analyzePasswordStrength(
  password: string,
): PasswordStrengthAnalysis {
  const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
    id: req.id,
    label: req.label,
    met: checkRequirement(req.id, password),
  }));

  const requirementsMet = requirements.filter((r) => r.met).length;
  const isValid = requirementsMet === PASSWORD_REQUIREMENTS.length;
  const level = resolveLevel(password, requirementsMet);

  let barPercent = 0;
  if (password) {
    barPercent = Math.round(
      (requirementsMet / PASSWORD_REQUIREMENTS.length) * 70,
    );
    if (isValid) {
      barPercent = password.length >= 12 ? 100 : 88;
      if (level === "strong") barPercent = 100;
    }
  }

  return {
    level,
    levelLabel:
      level === "empty" ? "" : LEVEL_LABELS[level],
    barPercent,
    requirements,
    isValid,
  };
}

export function getPasswordValidationError(password: string): string | null {
  const { requirements } = analyzePasswordStrength(password);
  const missing = requirements.find((r) => !r.met);
  if (!missing) return null;

  switch (missing.id) {
    case "minLength":
      return "La contraseña debe tener al menos 8 caracteres.";
    case "lowercase":
      return "La contraseña debe incluir al menos una letra minúscula.";
    case "uppercase":
      return "La contraseña debe incluir al menos una letra mayúscula.";
    case "digit":
      return "La contraseña debe incluir al menos un número.";
    default:
      return "La contraseña no cumple los requisitos de seguridad.";
  }
}

export function validatePasswordStrength(
  password: string,
): { ok: true } | { ok: false; error: string } {
  const error = getPasswordValidationError(password);
  if (error) {
    return { ok: false, error };
  }
  return { ok: true };
}
