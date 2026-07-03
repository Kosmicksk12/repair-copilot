import type { CopilotToolName, CopilotToolResult } from "./types";

export function createMockToolResult<TData>(tool: CopilotToolName, data: TData, message: string): CopilotToolResult<TData> {
  return {
    ok: true,
    tool,
    data,
    message,
    meta: {
      mocked: true,
      executedAt: new Date().toISOString(),
    },
  };
}
