import { NextResponse } from "next/server";
import { parseInventoryCatalog } from "@/lib/inventory-catalogs";
import { importInventoryProducts } from "@/lib/inventory-store";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecciona un archivo Excel válido." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseInventoryCatalog(buffer, file.name);
  const summary = importInventoryProducts(parsed.products, parsed.summary);

  return NextResponse.json({ summary });
}
