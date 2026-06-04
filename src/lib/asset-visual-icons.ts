import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Box,
  Brain,
  Cloud,
  Database,
  FileCode2,
  FileSearch,
  GitBranch,
  Landmark,
  Layers,
  Lock,
  Network,
  Shield,
  Workflow,
} from "lucide-react";
import type { CategoriaAgente } from "@/types/database";
import { getPlaceholder } from "@/lib/placeholders";

export interface AssetVisualIconOption {
  id: string;
  label: string;
  Icon: LucideIcon;
  gradient: string;
}

export const ASSET_VISUAL_ICON_OPTIONS = [
  {
    id: "certia-icon:workflow",
    label: "Automatización",
    Icon: Workflow,
    gradient: "from-blue-900/80 via-indigo-900/60 to-neutral-900",
  },
  {
    id: "certia-icon:stack",
    label: "Orquestación",
    Icon: Layers,
    gradient: "from-cyan-900/80 via-sky-900/60 to-neutral-900",
  },
  {
    id: "certia-icon:database",
    label: "Datos",
    Icon: Database,
    gradient: "from-rose-900/80 via-pink-900/50 to-neutral-900",
  },
  {
    id: "certia-icon:shield",
    label: "Compliance",
    Icon: Shield,
    gradient: "from-violet-900/80 via-purple-900/60 to-neutral-900",
  },
  {
    id: "certia-icon:search",
    label: "RAG / búsqueda",
    Icon: FileSearch,
    gradient: "from-emerald-900/80 via-teal-900/60 to-neutral-900",
  },
  {
    id: "certia-icon:finance",
    label: "Finanzas",
    Icon: Landmark,
    gradient: "from-amber-900/80 via-yellow-900/50 to-neutral-900",
  },
  {
    id: "certia-icon:bot",
    label: "Agente IA",
    Icon: Bot,
    gradient: "from-red-900/80 via-orange-900/50 to-neutral-900",
  },
  {
    id: "certia-icon:brain",
    label: "Cognitivo",
    Icon: Brain,
    gradient: "from-fuchsia-900/80 via-purple-900/55 to-neutral-900",
  },
  {
    id: "certia-icon:cloud",
    label: "Cloud",
    Icon: Cloud,
    gradient: "from-sky-900/80 via-blue-900/55 to-neutral-900",
  },
  {
    id: "certia-icon:network",
    label: "Red / APIs",
    Icon: Network,
    gradient: "from-teal-900/75 via-cyan-900/55 to-neutral-900",
  },
  {
    id: "certia-icon:lock",
    label: "Seguridad",
    Icon: Lock,
    gradient: "from-zinc-800/90 via-neutral-800/70 to-neutral-900",
  },
  {
    id: "certia-icon:code",
    label: "Runtime",
    Icon: FileCode2,
    gradient: "from-slate-800/90 via-zinc-800/70 to-neutral-900",
  },
  {
    id: "certia-icon:git",
    label: "Pipeline",
    Icon: GitBranch,
    gradient: "from-indigo-900/80 via-violet-900/55 to-neutral-900",
  },
  {
    id: "certia-icon:box",
    label: "Genérico",
    Icon: Box,
    gradient: "from-neutral-800/90 via-zinc-800/70 to-neutral-900",
  },
] as const satisfies readonly AssetVisualIconOption[];

export type AssetVisualIconId = (typeof ASSET_VISUAL_ICON_OPTIONS)[number]["id"];

export const DEFAULT_ASSET_VISUAL_ICON: AssetVisualIconId = "certia-icon:workflow";

const ICON_IDS = new Set<string>(
  ASSET_VISUAL_ICON_OPTIONS.map((option) => option.id),
);

export function isAssetVisualIconId(value: string): value is AssetVisualIconId {
  return ICON_IDS.has(value);
}

export function getAssetVisualIconOption(
  id: AssetVisualIconId,
): AssetVisualIconOption {
  const found = ASSET_VISUAL_ICON_OPTIONS.find((option) => option.id === id);
  return found ?? ASSET_VISUAL_ICON_OPTIONS[0];
}

export type AssetCardVisual =
  | { kind: "preset"; option: AssetVisualIconOption }
  | { kind: "image"; url: string }
  | { kind: "category"; gradient: string; Icon: LucideIcon };

export function resolveAssetCardVisual(
  imagenUrl: string | null,
  categoria: CategoriaAgente,
): AssetCardVisual {
  if (imagenUrl && isAssetVisualIconId(imagenUrl)) {
    return { kind: "preset", option: getAssetVisualIconOption(imagenUrl) };
  }

  if (
    imagenUrl &&
    (imagenUrl.startsWith("http://") ||
      imagenUrl.startsWith("https://") ||
      imagenUrl.startsWith("/"))
  ) {
    return { kind: "image", url: imagenUrl };
  }

  const placeholder = getPlaceholder(categoria);
  return {
    kind: "category",
    gradient: placeholder.gradient,
    Icon: placeholder.icon,
  };
}
