import { NextResponse } from "next/server";
import { createFineTuningRequest } from "@/lib/fine-tuning-service";

export const runtime = "nodejs";

interface FineTuningPayload {
  agenteId: string;
  contextoPrivadoDesc: string;
  userEmail: string;
  userName: string;
}

function parsePayload(body: unknown): FineTuningPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Body inválido.");
  }

  const data = body as Record<string, unknown>;
  const agenteId = String(data.agenteId ?? "").trim();
  const contextoPrivadoDesc = String(data.contextoPrivadoDesc ?? "").trim();
  const userEmail = String(data.userEmail ?? "").trim();
  const userName = String(data.userName ?? "").trim();

  if (!agenteId) {
    throw new Error("Falta el identificador del agente.");
  }
  if (!contextoPrivadoDesc) {
    throw new Error("La descripción del contexto privado es obligatoria.");
  }
  if (!userEmail) {
    throw new Error("Se requiere un email de usuario autenticado.");
  }

  return {
    agenteId,
    contextoPrivadoDesc,
    userEmail,
    userName: userName || userEmail.split("@")[0] || "Usuario",
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const payload = parsePayload(body);
    const result = await createFineTuningRequest(payload);

    return NextResponse.json({
      ok: true,
      message:
        "Solicitud de fine-tuning registrada correctamente. El desarrollador revisará tu propuesta en su panel de control.",
      ...result,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido.";
    return NextResponse.json(
      { ok: false, error: detail },
      { status: error instanceof Error && detail.includes("mínimo") ? 400 : 500 },
    );
  }
}
