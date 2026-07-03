import { NextResponse } from "next/server";
import {
  createServiceOrder,
  listServiceOrders,
  validateCreateInput,
} from "@/lib/service-orders-store";
import type { RepairStatus } from "@/lib/service-order-types";
import { isValidRepairStatus } from "@/lib/service-orders-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const search = searchParams.get("search") ?? undefined;
  const clientPhone = searchParams.get("clientPhone") ?? undefined;

  const status =
    statusParam && isValidRepairStatus(statusParam) ? (statusParam as RepairStatus) : undefined;

  const orders = listServiceOrders({ status, search, clientPhone });

  return NextResponse.json({ orders, total: orders.length });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validated = validateCreateInput(body);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const order = createServiceOrder(validated);

  return NextResponse.json({ order }, { status: 201 });
}
