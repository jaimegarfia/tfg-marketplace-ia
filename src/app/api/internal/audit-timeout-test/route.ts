import { NextResponse } from "next/server";
import { runAuditEngine } from "@/lib/audit-engine";

export const runtime = "nodejs";

/**
 * Endpoint interno de prueba para validar el circuito defensivo de timeout
 * del sandbox Docker.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Test de timeout deshabilitado en producción." },
      { status: 403 },
    );
  }

  const expectedToken = process.env.SEED_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta SEED_TOKEN en .env.local. Define el token para usar endpoints internos.",
      },
      { status: 500 },
    );
  }

  const providedToken = request.headers.get("x-seed-token");
  if (providedToken !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "No autorizado para ejecutar test interno." },
      { status: 401 },
    );
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    // Body opcional; se usa payload por defecto si no viene JSON válido.
  }

  const body = (payload ?? {}) as {
    assetId?: string;
    assetName?: string;
    descriptor?: unknown;
  };

  const descriptor =
    body.descriptor ??
    {
      technical_descriptor: {
        blueprint: "FORCE_TIMEOUT",
        kind: "timeout-probe",
      },
    };

  try {
    const result = await runAuditEngine({
      assetId: body.assetId,
      assetName: body.assetName ?? "Timeout Probe Asset",
      assetDescriptor: JSON.stringify(descriptor),
      tipoActivo: "reference_architecture",
    });

    return NextResponse.json({
      ok: true,
      timeoutExpected: true,
      result,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { ok: false, error: "El test interno falló.", detail },
      { status: 500 },
    );
  }
}
