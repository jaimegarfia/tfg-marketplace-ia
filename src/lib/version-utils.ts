function parseVersionParts(version: string): number[] | null {
  const trimmed = version.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(".").map((segment) => {
    const match = segment.match(/^(\d+)/);
    return match ? Number.parseInt(match[1] ?? "", 10) : Number.NaN;
  });

  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts;
}

/**
 * Compara dos versiones tipo semver (major.minor.patch).
 * Devuelve -1 si a < b, 0 si igual, 1 si a > b, null si alguna es inválida.
 */
export function compareVersions(a: string, b: string): number | null {
  const partsA = parseVersionParts(a);
  const partsB = parseVersionParts(b);

  if (!partsA || !partsB) return null;

  const length = Math.max(partsA.length, partsB.length);
  for (let index = 0; index < length; index += 1) {
    const left = partsA[index] ?? 0;
    const right = partsB[index] ?? 0;
    if (left < right) return -1;
    if (left > right) return 1;
  }

  return 0;
}

export function validateVersionIncrement(
  currentVersion: string,
  nextVersion: string,
): { ok: true } | { ok: false; error: string } {
  const next = nextVersion.trim();
  const current = currentVersion.trim();

  if (!next) {
    return { ok: false, error: "La versión es obligatoria." };
  }

  const comparison = compareVersions(next, current);
  if (comparison === null) {
    return {
      ok: false,
      error:
        "Usa un formato de versión válido (ej. 1.0.0). Solo números separados por puntos.",
    };
  }

  if (comparison < 0) {
    return {
      ok: false,
      error: `La nueva versión no puede ser inferior a la actual (v${current}).`,
    };
  }

  if (comparison === 0) {
    return {
      ok: false,
      error: `La nueva versión debe ser superior a la actual (v${current}).`,
    };
  }

  return { ok: true };
}
