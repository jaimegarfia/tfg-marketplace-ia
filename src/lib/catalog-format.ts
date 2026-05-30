import type { TipoActivo } from "@/types/database";

const ETIQUETAS_TIPO: Record<TipoActivo, string> = {
  runtime_artifact: "Artefacto ejecutable",
  reference_architecture: "Arquitectura de referencia",
};

export function etiquetaTipoActivo(tipo: TipoActivo): string {
  return ETIQUETAS_TIPO[tipo];
}

export function formatearPrecio(precioUsd: number): string {
  if (precioUsd === 0) return "Gratis";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(precioUsd);
}
