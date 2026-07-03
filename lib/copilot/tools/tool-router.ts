import { getCopilotTool, listCopilotTools } from "./registry";
import type { CopilotToolName, ToolRouterExecuteOptions } from "./types";

export class ToolRouter {
  listTools() {
    return listCopilotTools();
  }

  getTool(name: CopilotToolName) {
    return getCopilotTool(name);
  }

  async execute({ tool, input, context }: ToolRouterExecuteOptions) {
    const definition = this.getTool(tool);

    if (!definition) {
      throw new Error(`Copilot tool not found: ${tool}`);
    }

    return definition.execute(input, context);
  }
}

export const toolRouter = new ToolRouter();
