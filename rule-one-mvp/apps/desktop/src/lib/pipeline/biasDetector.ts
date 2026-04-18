import { chat } from "../llm/modelGateway";
import { toGatewayError } from "../llm/errors";
import { buildBiasDetectorPrompts } from "./prompts";
import {
  inferBiasLabelFromStructuredReview,
  normalizeBiasLabel,
  parseJsonResponse,
  toPipelineError,
  validateBiasDetectorOutput,
  type BiasDetectorInput,
  type BiasDetectorOutput,
} from "./types";

export async function biasDetector(input: BiasDetectorInput): Promise<BiasDetectorOutput> {
  const prompts = buildBiasDetectorPrompts(input);

  try {
    const result = await chat({
      taskName: "bias_detect",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user },
      ],
      options: {
        temperature: 0,
        maxTokens: 220,
      },
    });

    const parsed = parseJsonResponse(result.content);

    try {
      return validateBiasDetectorOutput(parsed);
    } catch (validationError) {
      const recovered = recoverBiasDetectorOutput(parsed, input);

      if (recovered) {
        console.warn("Rule One biasDetector recovered non-standard bias label:", {
          parsed,
          recovered,
        });
        return recovered;
      }

      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ModelGatewayError") {
      throw toPipelineError("biasDetector", "MODEL_ERROR", toGatewayError(error).message, error, "bias_detect");
    }

    throw toPipelineError(
      "biasDetector",
      "PARSE_ERROR",
      error instanceof Error ? error.message : "Bias Detector failed.",
      error,
      "bias_detect",
    );
  }
}

function recoverBiasDetectorOutput(parsed: unknown, input: BiasDetectorInput): BiasDetectorOutput | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      main_bias: inferBiasLabelFromStructuredReview(input.structured_review),
      bias_explanation: "Recovered from local fallback because the provider output was not a valid bias object.",
    };
  }

  const record = parsed as Record<string, unknown>;
  const candidates = [
    typeof record.main_bias === "string" ? record.main_bias : "",
    typeof record.bias_explanation === "string" ? record.bias_explanation : "",
    JSON.stringify(record),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeBiasLabel(candidate);
    if (normalized) {
      return {
        main_bias: normalized,
        bias_explanation:
          typeof record.bias_explanation === "string" && record.bias_explanation.trim()
            ? record.bias_explanation.trim()
            : `Recovered from provider output: ${candidate}`,
      };
    }
  }

  return {
    main_bias: inferBiasLabelFromStructuredReview(input.structured_review),
    bias_explanation: "Recovered from local structured review fallback because the provider returned a non-standard bias label.",
  };
}
