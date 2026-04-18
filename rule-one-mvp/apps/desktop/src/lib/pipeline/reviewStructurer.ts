import { chat } from "../llm/modelGateway";
import { toGatewayError } from "../llm/errors";
import { buildReviewStructurerPrompts } from "./prompts";
import {
  parseJsonResponse,
  toPipelineError,
  validateReviewStructurerOutput,
  type ReviewStructurerInput,
  type ReviewStructurerOutput,
} from "./types";

export async function reviewStructurer(input: ReviewStructurerInput): Promise<ReviewStructurerOutput> {
  const prompts = buildReviewStructurerPrompts(input);

  try {
    const result = await chat({
      taskName: "review_structuring",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      options: {
        temperature: 0,
        maxTokens: 400,
      },
    });

    return validateReviewStructurerOutput(parseJsonResponse(result.content));
  } catch (error) {
    if (error instanceof Error && error.name === "ModelGatewayError") {
      throw toPipelineError("reviewStructurer", "MODEL_ERROR", toGatewayError(error).message, error, "review_structuring");
    }

    throw toPipelineError(
      "reviewStructurer",
      "PARSE_ERROR",
      error instanceof Error ? error.message : "Review Structurer failed.",
      error,
      "review_structuring",
    );
  }
}
