import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getPublicOrderUrl, getServiceOrderByNumber } from "@/lib/service-orders-store";

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
  const url = getPublicOrderUrl(order.orderNumber, baseUrl);

  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 256,
    margin: 1,
    color: { dark: "#18181b", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
