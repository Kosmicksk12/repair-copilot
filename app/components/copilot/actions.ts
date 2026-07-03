"use server";

import { toolRouter } from "@/lib/copilot/tools";
import type { InventorySearchResult } from "@/lib/copilot/tools";

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
