import RepairCopilotDashboard from "./components/RepairCopilotDashboard";
import { listInventoryProducts } from "@/lib/inventory-store";
import { listSales, buildMonthlySalesHistory, getMonthlySalesSummary } from "@/lib/sales-store";
import { listServiceOrders } from "@/lib/service-orders-store";

export default function Home() {
  const orders = listServiceOrders();
  const products = listInventoryProducts();
  const sales = listSales();
  const monthlyHistory = buildMonthlySalesHistory(orders, sales);
  const monthlySales = getMonthlySalesSummary(orders, new Date(), sales);

  return (
    <RepairCopilotDashboard
      initialDashboardData={{
        orders,
        products,
        monthlySales,
        monthlyHistory,
      }}
    />
  );
}

export const dynamic = "force-dynamic";
