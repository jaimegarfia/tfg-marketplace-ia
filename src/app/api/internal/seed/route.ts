import { NextResponse } from "next/server";
import { seedCatalogData } from "@/lib/seed";

export const runtime = "nodejs";

/**
 * Endpoint temporal para sembrar datos de catálogo.
 * Seguridad:
 *  - Solo permite POST.
 *  - Requiere cabecera x-seed-token.
 *  - Bloqueado en producción.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Seed deshabilitado en producción." },
      { status: 403 },
    );
  }

  const expectedToken = process.env.SEED_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta SEED_TOKEN en .env.local. Define el token antes de usar el endpoint de seed.",
      },
      { status: 500 },
    );
  }

  const providedToken = request.headers.get("x-seed-token");
  if (providedToken !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "No autorizado para ejecutar seed." },
      { status: 401 },
    );
  }

  try {
    const summary = await seedCatalogData();
    return NextResponse.json({
      ok: true,
      message: "Seed de catálogo aplicado correctamente.",
      summary,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, error: "No se pudo ejecutar el seed.", detail },
      { status: 500 },
    );
  }
}
