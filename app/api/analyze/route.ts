import { NextResponse } from "next/server";
import { analyzeCustomerMessage } from "@/lib/repair-analysis";
import { enhanceWithOpenAI } from "@/lib/openai-adapter";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { textoCliente?: string } | null;
  const textoCliente = body?.textoCliente?.trim();

  if (!textoCliente) {
    return NextResponse.json(
      { error: "El campo textoCliente es requerido." },
      { status: 400 },
    );
  }

  const localResult = await analyzeCustomerMessage(textoCliente);
  const result = await enhanceWithOpenAI({ textoCliente, localResult });

  return NextResponse.json(result);
}
