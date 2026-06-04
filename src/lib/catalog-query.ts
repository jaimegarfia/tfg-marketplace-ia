import type {
  AgenteConAuditoria,
  CategoriaAgente,
  TipoActivo,
} from "@/types/database";

export type SortOption =
  | "relevancia"
  | "precio_asc"
  | "precio_desc"
  | "recientes"
  | "rating";

export interface CatalogFilters {
  q: string;
  categoria: CategoriaAgente | "todos";
  tipo: TipoActivo | "todos";
  precioMin: number | null;
  precioMax: number | null;
  soloGratis: boolean;
  sort: SortOption;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  q: "",
  categoria: "todos",
  tipo: "todos",
  precioMin: null,
  precioMax: null,
  soloGratis: false,
  sort: "relevancia",
};

const VALID_CATEGORIAS = new Set<string>([
  "todos",
  "rag",
  "automatizacion",
  "finanzas",
  "compliance",
  "orquestacion",
  "datos",
  "seguridad",
  "otros",
]);

const VALID_TIPOS = new Set<string>([
  "todos",
  "runtime_artifact",
  "reference_architecture",
]);

const VALID_SORT = new Set<string>([
  "relevancia",
  "precio_asc",
  "precio_desc",
  "recientes",
  "rating",
]);

function parseNumber(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams,
): CatalogFilters {
  const categoriaRaw = params.get("cat") ?? "todos";
  const tipoRaw = params.get("tipo") ?? "todos";
  const sortRaw = params.get("sort") ?? "relevancia";

  return {
    q: params.get("q")?.trim() ?? "",
    categoria: VALID_CATEGORIAS.has(categoriaRaw)
      ? (categoriaRaw as CatalogFilters["categoria"])
      : "todos",
    tipo: VALID_TIPOS.has(tipoRaw)
      ? (tipoRaw as CatalogFilters["tipo"])
      : "todos",
    precioMin: parseNumber(params.get("min")),
    precioMax: parseNumber(params.get("max")),
    soloGratis: params.get("gratis") === "1",
    sort: VALID_SORT.has(sortRaw) ? (sortRaw as SortOption) : "relevancia",
  };
}

export function filtersToSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoria !== "todos") params.set("cat", filters.categoria);
  if (filters.tipo !== "todos") params.set("tipo", filters.tipo);
  if (filters.precioMin !== null) params.set("min", String(filters.precioMin));
  if (filters.precioMax !== null) params.set("max", String(filters.precioMax));
  if (filters.soloGratis) params.set("gratis", "1");
  if (filters.sort !== "relevancia") params.set("sort", filters.sort);
  return params;
}

function matchesQuery(agente: AgenteConAuditoria, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const haystack = [
    agente.nombre,
    agente.descripcion,
    agente.desarrollador_nombre ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterAgentes(
  agentes: AgenteConAuditoria[],
  filters: CatalogFilters,
): AgenteConAuditoria[] {
  return agentes.filter((agente) => {
    if (!matchesQuery(agente, filters.q)) return false;
    if (filters.categoria !== "todos" && agente.categoria !== filters.categoria) {
      return false;
    }
    if (filters.tipo !== "todos" && agente.tipo_activo !== filters.tipo) {
      return false;
    }
    if (filters.soloGratis && agente.precio_eur !== 0) {
      return false;
    }
    if (filters.precioMin !== null && agente.precio_eur < filters.precioMin) {
      return false;
    }
    if (filters.precioMax !== null && agente.precio_eur > filters.precioMax) {
      return false;
    }
    return true;
  });
}

function relevanceScore(agente: AgenteConAuditoria, q: string): number {
  if (!q) return 0;
  const needle = q.toLowerCase();
  let score = 0;
  if (agente.nombre.toLowerCase().includes(needle)) score += 3;
  if (agente.descripcion.toLowerCase().includes(needle)) score += 1;
  return score;
}

export function sortAgentes(
  agentes: AgenteConAuditoria[],
  sort: SortOption,
  q = "",
): AgenteConAuditoria[] {
  const copy = [...agentes];
  switch (sort) {
    case "precio_asc":
      return copy.sort((a, b) => a.precio_eur - b.precio_eur);
    case "precio_desc":
      return copy.sort((a, b) => b.precio_eur - a.precio_eur);
    case "recientes":
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "rating":
      return copy.sort((a, b) => {
        if (b.rating_promedio !== a.rating_promedio) {
          return b.rating_promedio - a.rating_promedio;
        }
        return b.num_valoraciones - a.num_valoraciones;
      });
    case "relevancia":
    default:
      if (!q) return copy;
      return copy.sort(
        (a, b) => relevanceScore(b, q) - relevanceScore(a, q),
      );
  }
}

export function applyCatalogQuery(
  agentes: AgenteConAuditoria[],
  filters: CatalogFilters,
): AgenteConAuditoria[] {
  const filtered = filterAgentes(agentes, filters);
  return sortAgentes(filtered, filters.sort, filters.q);
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.q !== "" ||
    filters.categoria !== "todos" ||
    filters.tipo !== "todos" ||
    filters.soloGratis ||
    filters.precioMin !== null ||
    filters.precioMax !== null ||
    filters.sort !== "relevancia"
  );
}
