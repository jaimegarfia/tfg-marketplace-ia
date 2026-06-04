import type { CategoriaAgente, TipoActivo } from "@/types/database";

const ETIQUETAS_TIPO: Record<TipoActivo, string> = {
  runtime_artifact: "Artefacto ejecutable",
  reference_architecture: "Arquitectura de referencia",
};

const ETIQUETAS_CATEGORIA: Record<CategoriaAgente, string> = {
  rag: "RAG",
  automatizacion: "Automatización",
  finanzas: "Finanzas",
  compliance: "Compliance",
  orquestacion: "Orquestación",
  datos: "Datos",
  seguridad: "Seguridad",
};

export const CATEGORIAS_AGENTE: readonly CategoriaAgente[] = [
  "rag",
  "automatizacion",
  "finanzas",
  "compliance",
  "orquestacion",
  "datos",
  "seguridad",
] as const;

export function etiquetaTipoActivo(tipo: TipoActivo): string {
  return ETIQUETAS_TIPO[tipo];
}

export function etiquetaCategoria(categoria: CategoriaAgente): string {
  return ETIQUETAS_CATEGORIA[categoria];
}

/** Moneda de catálogo y panel desarrollador (valores numéricos en BD, columna `precio_usd`). */
export const MONEDA_CATALOGO = "EUR" as const;

export function formatearPrecio(precio: number): string {
  if (precio === 0) return "Gratis";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: MONEDA_CATALOGO,
    maximumFractionDigits: 0,
  }).format(precio);
}

export function formatearRating(rating: number): string {
  return rating.toFixed(1);
}
