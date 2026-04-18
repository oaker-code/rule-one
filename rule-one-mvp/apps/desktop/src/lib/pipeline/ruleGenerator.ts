import { chat } from "../llm/modelGateway";
import { toGatewayError } from "../llm/errors";
import { buildRuleGeneratorPrompts } from "./prompts";
import {
  inferRuleTag,
  parseJsonResponse,
  toPipelineError,
  validateRuleGeneratorOutput,
  type RuleGeneratorInput,
  type RuleGeneratorOutput,
} from "./types";

export async function ruleGenerator(input: RuleGeneratorInput): Promise<RuleGeneratorOutput> {
  const prompts = buildRuleGeneratorPrompts(input);

  try {
    const result = await chat({
      taskName: "rule_generate",
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
      return validateRuleGeneratorOutput(parsed);
    } catch (validationError) {
      const recovered = recoverRuleGeneratorOutput(parsed, input);
      if (recovered) {
        console.warn("Rule One ruleGenerator recovered non-standard rule tag:", {
          parsed,
          recovered,
        });
        return recovered;
      }

      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ModelGatewayError") {
      throw toPipelineError("ruleGenerator", "MODEL_ERROR", toGatewayError(error).message, error, "rule_generate");
    }

    throw toPipelineError(
      "ruleGenerator",
      "PARSE_ERROR",
      error instanceof Error ? error.message : "Rule Generator failed.",
      error,
      "rule_generate",
    );
  }
}

function recoverRuleGeneratorOutput(parsed: unknown, input: RuleGeneratorInput): RuleGeneratorOutput | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const didWell = typeof record.did_well === "string" ? record.did_well.trim() : "";
  const ruleOne = typeof record.rule_one === "string" ? record.rule_one.trim() : "";

  if (!didWell || !ruleOne) {
    return null;
  }

  return {
    did_well: didWell,
    rule_one: ruleOne,
    rule_tag:
      typeof record.rule_tag === "string"
        ? inferRuleTag(input.main_bias, `${record.rule_tag} ${ruleOne}`)
        : inferRuleTag(input.main_bias, ruleOne),
  };
}
