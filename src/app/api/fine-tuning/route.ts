import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { createFineTuningRequest } from "@/lib/fine-tuning-service";

export const runtime = "nodejs";

interface FineTuningPayload {
  agenteId: string;
  contextoPrivadoDesc: string;
}

function parsePayload(body: unknown): FineTuningPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Body inválido.");
  }

  const data = body as Record<string, unknown>;
  const agenteId = String(data.agenteId ?? "").trim();
  const contextoPrivadoDesc = String(data.contextoPrivadoDesc ?? "").trim();

  if (!agenteId) {
    throw new Error("Falta el identificador del agente.");
  }
  if (!contextoPrivadoDesc) {
    throw new Error("La descripción del contexto privado es obligatoria.");
  }

  return {
    agenteId,
    contextoPrivadoDesc,
  };
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Debes iniciar sesión para solicitar una adaptación." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const payload = parsePayload(body);

    const result = await createFineTuningRequest({
      agenteId: payload.agenteId,
      contextoPrivadoDesc: payload.contextoPrivadoDesc,
      userEmail: session.email,
      userName: session.nombre,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Solicitud de fine-tuning registrada correctamente. El desarrollador revisará tu propuesta en su panel de control.",
      ...result,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido.";
    const isValidation =
      error instanceof Error &&
      (detail.includes("mínimo") ||
        detail.includes("obligator") ||
        detail.includes("Falta"));
    return NextResponse.json(
      { ok: false, error: detail },
      { status: isValidation ? 400 : 500 },
    );
  }
}
