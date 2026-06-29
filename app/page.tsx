import RepairCopilotDashboard from "./components/RepairCopilotDashboard";
import { analyzeCustomerMessage } from "@/lib/repair-analysis";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const rawMessage = params.textoCliente;
  const initialMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  const initialResult = initialMessage
    ? await analyzeCustomerMessage(initialMessage)
    : null;

  return (
    <RepairCopilotDashboard
      initialMessage={initialMessage}
      initialResult={initialResult}
    />
  );
}