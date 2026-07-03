import { NextResponse } from "next/server";
import {
  getServiceOrderByNumber,
  isValidRepairStatus,
  updateServiceOrder,
} from "@/lib/service-orders-store";
import type { RepairStatus } from "@/lib/service-order-types";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { orderNumber } = await context.params;
  const decoded = decodeURIComponent(orderNumber);
  const order = getServiceOrderByNumber(decoded);

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params;
  const decoded = decodeURIComponent(orderNumber);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  if (body.status !== undefined && (typeof body.status !== "string" || !isValidRepairStatus(body.status))) {
    return NextResponse.json({ error: "Estado de reparación inválido." }, { status: 400 });
  }

  const patch = {
    ...body,
    status: body.status as RepairStatus | undefined,
    estimatedValue:
      body.estimatedValue === undefined || body.estimatedValue === null || body.estimatedValue === ""
        ? undefined
        : Number(body.estimatedValue),
    accessories: Array.isArray(body.accessories)
      ? body.accessories.filter((item): item is string => typeof item === "string")
      : undefined,
  };

  const order = updateServiceOrder(decoded, patch);

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
