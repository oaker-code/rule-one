import { chat } from "../llm/modelGateway";
import { toGatewayError } from "../llm/errors";
import { buildSafetyFilterPrompts } from "./prompts";
import {
  parseJsonResponse,
  toPipelineError,
  validateSafetyFilterOutput,
  type ReviewResult,
  type SafetyFilterOutput,
} from "./types";

export async function safetyFilter(input: ReviewResult): Promise<SafetyFilterOutput> {
  const prompts = buildSafetyFilterPrompts(input);

  try {
    const result = await chat({
      taskName: "safety_filter",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      options: {
        temperature: 0,
        maxTokens: 420,
      },
    });

    const parsed = parseJsonResponse(result.content);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const cleanedResult =
        record.cleanedResult && typeof record.cleanedResult === "object" && !Array.isArray(record.cleanedResult)
          ? {
              rule_tag: input.rule_tag,
              ...(record.cleanedResult as Record<string, unknown>),
            }
          : record.cleanedResult;

      return validateSafetyFilterOutput({
        ...record,
        cleanedResult,
      });
    }

    return validateSafetyFilterOutput(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === "ModelGatewayError") {
      throw toPipelineError("safetyFilter", "MODEL_ERROR", toGatewayError(error).message, error, "safety_filter");
    }

    throw toPipelineError(
      "safetyFilter",
      "PARSE_ERROR",
      error instanceof Error ? error.message : "Safety Filter failed.",
      error,
      "safety_filter",
    );
  }
}
