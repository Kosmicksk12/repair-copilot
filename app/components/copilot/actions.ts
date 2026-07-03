"use server";

import { toolRouter } from "@/lib/copilot/tools";
import type { CreateOrderToolResult, InventorySearchResult, ServiceOrderSearchResult } from "@/lib/copilot/tools";

export async function searchInventoryForCopilot(query: string): Promise<InventorySearchResult[]> {
  const result = await toolRouter.execute({
    tool: "searchInventory",
    input: {
      query,
      limit: 5,
    },
  });

  return result.data as InventorySearchResult[];
}

export async function searchOrdersForCopilot(query: string): Promise<ServiceOrderSearchResult[]> {
  const result = await toolRouter.execute({
    tool: "searchOrder",
    input: {
      query,
      limit: 5,
    },
  });

  return result.data as ServiceOrderSearchResult[];
}

export async function createOrderForCopilot(payload: Record<string, unknown>): Promise<CreateOrderToolResult> {
  const result = await toolRouter.execute({
    tool: "createOrder",
    input: {
      payload,
    },
  });

  return result.data as CreateOrderToolResult;
}
