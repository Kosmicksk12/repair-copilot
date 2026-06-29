import type { AnalyzeResult } from "./repair-types";

export type OpenAIAnalysisContext = {
  textoCliente: string;
  localResult: AnalyzeResult;
};

export async function enhanceWithOpenAI(
  context: OpenAIAnalysisContext,
): Promise<AnalyzeResult> {
  // Future integration point: call OpenAI here with FAQ, repair history,
  // business rules and the deterministic local result as grounding context.
  return context.localResult;
}
