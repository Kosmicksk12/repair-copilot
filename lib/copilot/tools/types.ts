export type CopilotToolName =
  | "searchInventory"
  | "searchCustomer"
  | "searchOrder"
  | "searchWarranty"
  | "searchKnowledge"
  | "createOrder"
  | "updateOrder"
  | "registerSale"
  | "updateStock";

export type CopilotToolCategory = "search" | "mutation";

export type CopilotToolContext = {
  conversationId?: string;
  userId?: string;
  locale?: string;
};

export type CopilotToolInput = Record<string, unknown>;

export type CopilotToolResult<TData = unknown> = {
  ok: boolean;
  tool: CopilotToolName;
  data: TData;
  message: string;
  meta: {
    mocked: boolean;
    executedAt: string;
  };
};

export type CopilotToolDefinition<TInput extends CopilotToolInput = CopilotToolInput, TData = unknown> = {
  name: CopilotToolName;
  description: string;
  category: CopilotToolCategory;
  execute: (input?: TInput, context?: CopilotToolContext) => Promise<CopilotToolResult<TData>>;
};

export type ToolRouterExecuteOptions<TInput extends CopilotToolInput = CopilotToolInput> = {
  tool: CopilotToolName;
  input?: TInput;
  context?: CopilotToolContext;
};
