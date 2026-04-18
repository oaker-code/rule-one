import { biasDetector } from "./biasDetector";
import { emotionCatcher } from "./emotionCatcher";
import { ruleGenerator } from "./ruleGenerator";
import { reviewStructurer } from "./reviewStructurer";
import { safetyFilter } from "./safetyFilter";
import { selfRespectRewrite } from "./selfRespectRewrite";
import type { PipelineDemoResult, ReviewResult, ReviewSupervisorInput } from "./types";
import { toPipelineError } from "./types";

const SEVERE_SAFETY_RULES = [
  "INDIVIDUAL_STOCK_ADVICE",
  "BUY_SELL_ADVICE",
  "RETURN_PROMISE",
  "DEPENDENCY_LANGUAGE",
];

export async function run(input: ReviewSupervisorInput): Promise<ReviewResult> {
  try {
    const emotion = await emotionCatcher({
      emotionLabel: input.emotionLabel,
      rawInput: input.rawInput,
    });

    const structuredReview = await reviewStructurer({
      emotionLabel: emotion.emotion,
      structuredAnswers: input.structuredAnswers,
      rawInput: input.rawInput,
    });

    const bias = await biasDetector({
      structured_review: structuredReview,
    });

    const rule = await ruleGenerator({
      main_bias: bias.main_bias,
      structured_review: structuredReview,
    });

    const draft: ReviewResult = {
      emotion: emotion.emotion,
      structured_review: structuredReview,
      main_bias: bias.main_bias,
      did_well: rule.did_well,
      rule_one: rule.rule_one,
      rule_tag: rule.rule_tag,
      risk_flag: false,
    };

    const rewritten = await selfRespectRewrite(draft);
    const safety = await safetyFilter(rewritten);

    return {
      ...safety.cleanedResult,
      risk_flag: !safety.safe || safety.hitRules.some((ruleName) => SEVERE_SAFETY_RULES.includes(ruleName)),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "PipelineStageError") {
      throw error;
    }

    throw toPipelineError(
      "reviewSupervisor",
      "UNKNOWN_ERROR",
      error instanceof Error ? error.message : "Review supervisor failed.",
      error,
    );
  }
}

export async function demoReviewPipeline(): Promise<PipelineDemoResult> {
  const input: ReviewSupervisorInput = {
    emotionLabel: "焦虑",
    structuredAnswers: {
      market_context: "开盘后我看到价格快速上冲。",
      decision: "我没有按原计划等待确认，直接追进去了。",
      consequence: "随后回落，我又没有及时止损。",
    },
    rawInput:
      "今天一开始看到上涨我就很怕错过，临时追进去，回落后又不想认错，结果一直扛着，心里很慌，也觉得自己太冲动了。",
  };

  const output = await run(input);
  console.log("Rule One demoReviewPipeline result:", { input, output });

  return { input, output };
}
