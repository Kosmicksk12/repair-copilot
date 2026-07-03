import ActionCard from "./cards/ActionCard";
import AlertCard from "./cards/AlertCard";
import CustomerCard from "./cards/CustomerCard";
import InventoryCard from "./cards/InventoryCard";
import KnowledgeCard from "./cards/KnowledgeCard";
import OrderCard from "./cards/OrderCard";
import WarrantyCard from "./cards/WarrantyCard";
import type { ChatMessage, MessageActionHandler } from "./types";

export default function MessageRenderer({ message, onAction }: { message: ChatMessage; onAction?: MessageActionHandler }) {
  switch (message.type) {
    case "text": return <p className="whitespace-pre-wrap">{message.content}</p>;
    case "inventory": return <InventoryCard item={message.data} />;
    case "customer": return <CustomerCard customer={message.data} />;
    case "order": return <OrderCard order={message.data} />;
    case "warranty": return <WarrantyCard warranty={message.data} />;
    case "knowledge": return <KnowledgeCard article={message.data} />;
    case "action": return <ActionCard data={message.data} onAction={onAction} />;
    case "alert": return <AlertCard alert={message.data} />;
  }
}
