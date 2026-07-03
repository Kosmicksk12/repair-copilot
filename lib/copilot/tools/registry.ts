import { mutationTools } from "./mutation-tools";
import { searchTools } from "./search-tools";
import type { CopilotToolDefinition, CopilotToolName } from "./types";

export const copilotTools = [...searchTools, ...mutationTools] satisfies CopilotToolDefinition[];

export const copilotToolRegistry = copilotTools.reduce((registry, tool) => {
  registry[tool.name] = tool;
  return registry;
}, {} as Record<CopilotToolName, CopilotToolDefinition>);

export function getCopilotTool(name: CopilotToolName) {
  return copilotToolRegistry[name];
}

export function listCopilotTools() {
  return copilotTools;
}
