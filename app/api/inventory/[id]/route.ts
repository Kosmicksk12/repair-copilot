import { NextResponse } from "next/server";
import { deleteInventoryProduct, updateInventoryProduct } from "@/lib/inventory-store";
import { validateInventoryPatch } from "@/lib/inventory-validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const validated = validateInventoryPatch(body);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const product = updateInventoryProduct(decodeURIComponent(id), validated);

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = deleteInventoryProduct(decodeURIComponent(id));

  if (!deleted) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
