import { chat } from "../llm/modelGateway";
import { toGatewayError } from "../llm/errors";
import { buildEmotionCatcherPrompts } from "./prompts";
import {
  parseJsonResponse,
  toPipelineError,
  validateEmotionCatcherOutput,
  type EmotionCatcherInput,
  type EmotionCatcherOutput,
} from "./types";

export async function emotionCatcher(input: EmotionCatcherInput): Promise<EmotionCatcherOutput> {
  const prompts = buildEmotionCatcherPrompts(input);

  try {
    const result = await chat({
      taskName: "emotion_detect",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      options: {
        temperature: 0,
        maxTokens: 180,
      },
    });

    return validateEmotionCatcherOutput(parseJsonResponse(result.content));
  } catch (error) {
    if (error instanceof Error && error.name === "PipelineStageError") {
      throw error;
    }

    if (error instanceof Error && error.name === "ModelGatewayError") {
      throw toPipelineError("emotionCatcher", "MODEL_ERROR", toGatewayError(error).message, error, "emotion_detect");
    }

    throw toPipelineError(
      "emotionCatcher",
      "PARSE_ERROR",
      error instanceof Error ? error.message : "Emotion Catcher failed.",
      error,
      "emotion_detect",
    );
  }
}
