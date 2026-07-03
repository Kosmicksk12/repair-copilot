import { NextResponse } from "next/server";
import { createInventoryProduct, listInventoryProducts } from "@/lib/inventory-store";
import { validateInventoryInput } from "@/lib/inventory-validators";

export async function GET() {
  return NextResponse.json({ products: listInventoryProducts() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validated = validateInventoryInput(body);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  return NextResponse.json({ product: createInventoryProduct(validated) }, { status: 201 });
}
