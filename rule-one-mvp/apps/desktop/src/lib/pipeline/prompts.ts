import type {
  BiasDetectorInput,
  EmotionCatcherInput,
  ReviewResult,
  ReviewStructurerInput,
  RuleGeneratorInput,
} from "./types";
import { BIAS_LABELS, formatStructuredAnswers } from "./types";

const JSON_ONLY_RULE =
  "Return JSON only. Do not use markdown. Do not wrap the answer in code fences. Ensure all fields are present.";

export function buildEmotionCatcherPrompts(input: EmotionCatcherInput) {
  return {
    system: [
      "You are Emotion Catcher for Rule One.",
      "Read the user's current emotion label and raw reflection.",
      "Return a stable emotional label and a practical interaction tone.",
      JSON_ONLY_RULE,
      'Schema: {"emotion":"string","interaction_tone":"string"}',
    ].join("\n"),
    user: [
      `emotionLabel: ${input.emotionLabel}`,
      `rawInput: ${input.rawInput}`,
      "Keep the tone respectful, calm and useful.",
    ].join("\n"),
  };
}

export function buildReviewStructurerPrompts(input: ReviewStructurerInput) {
  return {
    system: [
      "You are Review Structurer for Rule One.",
      "Separate the reflection into facts, judgments, emotions and actions.",
      "Do not invent details that are not supported by the input.",
      JSON_ONLY_RULE,
      'Schema: {"facts":["string"],"judgments":["string"],"emotions":["string"],"actions":["string"]}',
    ].join("\n"),
    user: [
      `emotionLabel: ${input.emotionLabel}`,
      `structuredAnswers: ${formatStructuredAnswers(input.structuredAnswers)}`,
      `rawInput: ${input.rawInput}`,
    ].join("\n"),
  };
}

export function buildBiasDetectorPrompts(input: BiasDetectorInput) {
  return {
    system: [
      "You are Bias Detector for Rule One.",
      "Choose exactly one main bias from the allowed label set.",
      "Do not output multiple biases.",
      "Return one exact label from the allowed labels, not a synonym and not an explanation.",
      `Allowed labels: ${BIAS_LABELS.join(", ")}`,
      JSON_ONLY_RULE,
      'Schema: {"main_bias":"string","bias_explanation":"string"}',
    ].join("\n"),
    user: `structured_review: ${JSON.stringify(input.structured_review, null, 2)}`,
  };
}

export function buildRuleGeneratorPrompts(input: RuleGeneratorInput) {
  return {
    system: [
      "You are Rule Generator for Rule One.",
      "Write one short did_well line and one short rule_one line.",
      "Also return one rule_tag from the allowed tag set.",
      "rule_one must be executable, non-predictive, non-preachy, and preferably use the 如果...那么... pattern.",
      "Avoid market predictions and trading advice.",
      "Allowed rule tags: no_chasing, no_unplanned_add, no_revenge_trade, wait_for_confirmation, reduce_position, no_emotional_order",
      JSON_ONLY_RULE,
      'Schema: {"did_well":"string","rule_one":"string","rule_tag":"string"}',
    ].join("\n"),
    user: [
      `main_bias: ${input.main_bias}`,
      `structured_review: ${JSON.stringify(input.structured_review, null, 2)}`,
    ].join("\n"),
  };
}

export function buildSelfRespectRewritePrompts(input: ReviewResult) {
  return {
    system: [
      "You are Self Respect Rewrite for Rule One.",
      "Lightly rewrite any shaming, humiliating or identity-attacking language.",
      "Prefer wording like 这是一个可修复的行为偏差.",
      "Keep the result short, practical and emotionally safe.",
      JSON_ONLY_RULE,
      'Schema: {"emotion":"string","structured_review":{"facts":["string"],"judgments":["string"],"emotions":["string"],"actions":["string"]},"main_bias":"string","did_well":"string","rule_one":"string","rule_tag":"string","risk_flag":false}',
    ].join("\n"),
    user: `review_result: ${JSON.stringify(input, null, 2)}`,
  };
}

export function buildSafetyFilterPrompts(input: ReviewResult) {
  return {
    system: [
      "You are Safety Filter for Rule One.",
      "Remove or rewrite the following if present: stock picks, buy/sell advice, return promises, dependency language, highly stimulating language.",
      "If you detect safety issues, mark them in hitRules.",
      "cleanedResult must preserve the same structure as the input review result.",
      JSON_ONLY_RULE,
      'Schema: {"safe":true,"cleanedResult":{"emotion":"string","structured_review":{"facts":["string"],"judgments":["string"],"emotions":["string"],"actions":["string"]},"main_bias":"string","did_well":"string","rule_one":"string","rule_tag":"string","risk_flag":false},"hitRules":["string"]}',
    ].join("\n"),
    user: `review_result: ${JSON.stringify(input, null, 2)}`,
  };
}
