import ClientesModule from "./ClientesModule";
import { buildCustomerProfiles } from "@/lib/customer-profiles";
import { listInventoryProducts } from "@/lib/inventory-store";
import { listSales } from "@/lib/sales-store";
import { listServiceOrders } from "@/lib/service-orders-store";

export default function ClientesPage() {
  const profiles = buildCustomerProfiles(
    listServiceOrders(),
    listSales(),
    listInventoryProducts(),
  );

  return <ClientesModule initialProfiles={profiles} />;
}

export const dynamic = "force-dynamic";
