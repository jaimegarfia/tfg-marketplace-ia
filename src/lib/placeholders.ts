import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Database,
  FileSearch,
  Landmark,
  Layers,
  Shield,
  Workflow,
} from "lucide-react";
import type { CategoriaAgente } from "@/types/database";

export interface CategoriaPlaceholder {
  gradient: string;
  icon: LucideIcon;
  label: string;
}

export const PLACEHOLDER_POR_CATEGORIA: Record<
  CategoriaAgente,
  CategoriaPlaceholder
> = {
  rag: {
    gradient: "from-emerald-900/80 via-teal-900/60 to-neutral-900",
    icon: FileSearch,
    label: "RAG",
  },
  automatizacion: {
    gradient: "from-blue-900/80 via-indigo-900/60 to-neutral-900",
    icon: Workflow,
    label: "Automatización",
  },
  finanzas: {
    gradient: "from-amber-900/80 via-yellow-900/50 to-neutral-900",
    icon: Landmark,
    label: "Finanzas",
  },
  compliance: {
    gradient: "from-violet-900/80 via-purple-900/60 to-neutral-900",
    icon: Shield,
    label: "Compliance",
  },
  orquestacion: {
    gradient: "from-cyan-900/80 via-sky-900/60 to-neutral-900",
    icon: Layers,
    label: "Orquestación",
  },
  datos: {
    gradient: "from-rose-900/80 via-pink-900/50 to-neutral-900",
    icon: Database,
    label: "Datos",
  },
  seguridad: {
    gradient: "from-red-900/80 via-orange-900/50 to-neutral-900",
    icon: Bot,
    label: "Seguridad",
  },
};

export function getPlaceholder(categoria: CategoriaAgente): CategoriaPlaceholder {
  return PLACEHOLDER_POR_CATEGORIA[categoria];
}
