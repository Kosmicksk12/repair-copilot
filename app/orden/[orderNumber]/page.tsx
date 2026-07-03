import { notFound } from "next/navigation";
import PublicOrderStatus from "./PublicOrderStatus";
import { getServiceOrderByNumber, toPublicOrderStatus } from "@/lib/service-orders-store";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function PublicOrderPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  const order = getServiceOrderByNumber(decoded);

  if (!order) {
    notFound();
  }

  const publicStatus = toPublicOrderStatus(order);

  return <PublicOrderStatus order={order} publicStatus={publicStatus} />;
}
