import { NextResponse } from "next/server";
import {
  getServiceOrderByNumber,
  toPublicOrderStatus,
} from "@/lib/service-orders-store";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params;
  const decoded = decodeURIComponent(orderNumber);
  const order = getServiceOrderByNumber(decoded);

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  const baseUrl = new URL(request.url).origin;
  const publicStatus = toPublicOrderStatus(order, baseUrl);

  return NextResponse.json({
    ...publicStatus,
    statusHistoryReady: true,
    qrEnabled: true,
  });
}
