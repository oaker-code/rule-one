import { chat } from "../llm/modelGateway";
import { toGatewayError } from "../llm/errors";
import { buildSelfRespectRewritePrompts } from "./prompts";
import {
  parseJsonResponse,
  toPipelineError,
  validateReviewResult,
  type ReviewResult,
} from "./types";

export async function selfRespectRewrite(input: ReviewResult): Promise<ReviewResult> {
  const prompts = buildSelfRespectRewritePrompts(input);

  try {
    const result = await chat({
      taskName: "review_structuring",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      options: {
        temperature: 0,
        maxTokens: 320,
      },
    });

    const parsed = parseJsonResponse(result.content);
    const rewritten = validateReviewResult(
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? {
            rule_tag: input.rule_tag,
            ...parsed,
          }
        : parsed,
    );
    return {
      ...rewritten,
      rule_tag: input.rule_tag,
      risk_flag: input.risk_flag,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "ModelGatewayError") {
      throw toPipelineError(
        "selfRespectRewrite",
        "MODEL_ERROR",
        toGatewayError(error).message,
        error,
        "review_structuring",
      );
    }

    throw toPipelineError(
      "selfRespectRewrite",
      "PARSE_ERROR",
      error instanceof Error ? error.message : "Self Respect Rewrite failed.",
      error,
      "review_structuring",
    );
  }
}
