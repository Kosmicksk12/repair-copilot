import SalesModule from "./SalesModule";
import { getSalesPageData } from "./actions";

export default async function SalesPage() {
  const data = await getSalesPageData();
  return <SalesModule initialProducts={data.products} initialSales={data.sales} />;
}
