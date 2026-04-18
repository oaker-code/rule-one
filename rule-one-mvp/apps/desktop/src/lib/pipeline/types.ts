import type { ChatMessage, TaskName } from "../llm/types";

export const BIAS_LABELS = [
  "追涨型冲动",
  "报复性交易",
  "临时加仓",
  "死扛不认错",
  "盈利后膨胀",
  "高频无效操作",
  "计划外交易",
  "情绪驱动下单",
] as const;

export type BiasLabel = (typeof BIAS_LABELS)[number];

export const RULE_TAGS = [
  "no_chasing",
  "no_unplanned_add",
  "no_revenge_trade",
  "wait_for_confirmation",
  "reduce_position",
  "no_emotional_order",
] as const;

export type RuleTag = (typeof RULE_TAGS)[number];

export interface StructuredReview {
  facts: string[];
  judgments: string[];
  emotions: string[];
  actions: string[];
}

export interface ReviewResult {
  emotion: string;
  structured_review: StructuredReview;
  main_bias: BiasLabel;
  did_well: string;
  rule_one: string;
  rule_tag: RuleTag;
  risk_flag: boolean;
}

export interface EmotionCatcherInput {
  emotionLabel: string;
  rawInput: string;
}

export interface EmotionCatcherOutput {
  emotion: string;
  interaction_tone: string;
}

export interface ReviewStructurerInput {
  emotionLabel: string;
  structuredAnswers?: StructuredAnswers;
  rawInput: string;
}

export interface ReviewStructurerOutput extends StructuredReview {}

export interface BiasDetectorInput {
  structured_review: StructuredReview;
}

export interface BiasDetectorOutput {
  main_bias: BiasLabel;
  bias_explanation: string;
}

export interface RuleGeneratorInput {
  main_bias: BiasLabel;
  structured_review: StructuredReview;
}

export interface RuleGeneratorOutput {
  did_well: string;
  rule_one: string;
  rule_tag: RuleTag;
}

export interface SafetyFilterOutput {
  safe: boolean;
  cleanedResult: ReviewResult;
  hitRules: string[];
}

export interface ReviewSupervisorInput {
  emotionLabel: string;
  structuredAnswers?: StructuredAnswers;
  rawInput: string;
}

export type StructuredAnswers = string[] | Record<string, string | string[] | null | undefined>;

export interface PipelineDemoResult {
  input: ReviewSupervisorInput;
  output: ReviewResult;
}

export type PipelineStageName =
  | "emotionCatcher"
  | "reviewStructurer"
  | "biasDetector"
  | "ruleGenerator"
  | "selfRespectRewrite"
  | "safetyFilter"
  | "reviewSupervisor";

export type PipelineErrorCode = "MODEL_ERROR" | "PARSE_ERROR" | "VALIDATION_ERROR" | "UNKNOWN_ERROR";

export interface PipelineErrorDetails {
  stage: PipelineStageName;
  code: PipelineErrorCode;
  message: string;
  taskName?: TaskName;
  raw?: unknown;
}

export class PipelineStageError extends Error {
  readonly details: PipelineErrorDetails;

  constructor(details: PipelineErrorDetails) {
    super(details.message);
    this.name = "PipelineStageError";
    this.details = details;
  }
}

const BIAS_NORMALIZATION_ENTRIES: Array<[BiasLabel, string[]]> = [
  ["追涨型冲动", ["追涨型冲动", "追涨冲动", "追高冲动", "冲动追涨", "追高", "fomo追涨", "fomo"]],
  ["报复性交易", ["报复性交易", "报复交易", "报复性下单", "报复性操作", "连亏后报复性交易", "revenge trading"]],
  ["临时加仓", ["临时加仓", "冲动加仓", "随意加仓", "盘中加仓", "计划外加仓"]],
  ["死扛不认错", ["死扛不认错", "死扛", "扛单", "不认错", "拒绝止损", "硬扛亏损"]],
  ["盈利后膨胀", ["盈利后膨胀", "盈利膨胀", "赚钱后膨胀", "获利后膨胀", "盈利后自满"]],
  ["高频无效操作", ["高频无效操作", "高频交易", "无效高频操作", "频繁无效操作", "乱点乱买", "过度交易"]],
  ["计划外交易", ["计划外交易", "计划外下单", "脱离计划交易", "没按计划交易", "临盘改变计划"]],
  ["情绪驱动下单", ["情绪驱动下单", "情绪下单", "情绪化下单", "情绪驱动交易", "情绪化交易"]],
];

const RULE_TAG_NORMALIZATION_ENTRIES: Array<[RuleTag, string[]]> = [
  ["no_chasing", ["no_chasing", "no chasing", "avoid chasing", "不要追涨", "禁止追涨"]],
  ["no_unplanned_add", ["no_unplanned_add", "no unplanned add", "avoid averaging down", "不要临时加仓", "禁止补仓"]],
  ["no_revenge_trade", ["no_revenge_trade", "no revenge trade", "avoid revenge trading", "不要报复性交易"]],
  ["wait_for_confirmation", ["wait_for_confirmation", "wait for confirmation", "等待确认", "先确认再行动"]],
  ["reduce_position", ["reduce_position", "reduce position", "降低仓位", "减少仓位"]],
  ["no_emotional_order", ["no_emotional_order", "no emotional order", "avoid emotional order", "不要情绪化下单"]],
];

export function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Model returned empty content.");
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("Unable to parse JSON from model output.");
  }
}

export function formatStructuredAnswers(input?: StructuredAnswers): string {
  if (!input) {
    return "[]";
  }

  return JSON.stringify(input, null, 2);
}

export function createStageMessages(systemPrompt: string, userPrompt: string): ChatMessage[] {
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export function ensureString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

export function ensureStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be a string array.`);
  }

  return value.map((item) => ensureString(item, `${field}[]`));
}

export function normalizeBiasLabel(value: string): BiasLabel | null {
  const normalizedInput = sanitizeBiasText(value);

  for (const [label, candidates] of BIAS_NORMALIZATION_ENTRIES) {
    if (candidates.some((candidate) => sanitizeBiasText(candidate) === normalizedInput)) {
      return label;
    }
  }

  for (const [label, candidates] of BIAS_NORMALIZATION_ENTRIES) {
    if (candidates.some((candidate) => normalizedInput.includes(sanitizeBiasText(candidate)))) {
      return label;
    }
  }

  return null;
}

export function inferBiasLabelFromStructuredReview(review: StructuredReview): BiasLabel {
  const source = sanitizeBiasText(
    [...review.facts, ...review.judgments, ...review.emotions, ...review.actions].join(" "),
  );

  if (includesAny(source, ["报复", "扳回", "赚回来", "翻本"])) {
    return "报复性交易";
  }

  if (includesAny(source, ["追高", "怕踏空", "错过", "fomo", "追涨"])) {
    return "追涨型冲动";
  }

  if (includesAny(source, ["加仓", "补仓"])) {
    return "临时加仓";
  }

  if (includesAny(source, ["死扛", "扛单", "不认错", "拒绝止损", "不止损"])) {
    return "死扛不认错";
  }

  if (includesAny(source, ["膨胀", "自满", "得意", "轻敌"])) {
    return "盈利后膨胀";
  }

  if (includesAny(source, ["高频", "频繁", "乱点", "过度交易"])) {
    return "高频无效操作";
  }

  if (includesAny(source, ["计划外", "没按计划", "临盘", "脱离计划"])) {
    return "计划外交易";
  }

  return "情绪驱动下单";
}

export function validateEmotionCatcherOutput(value: unknown): EmotionCatcherOutput {
  const record = ensureRecord(value, "emotionCatcherOutput");
  return {
    emotion: ensureString(record.emotion, "emotion"),
    interaction_tone: ensureString(record.interaction_tone, "interaction_tone"),
  };
}

export function validateReviewStructurerOutput(value: unknown): ReviewStructurerOutput {
  const record = ensureRecord(value, "reviewStructurerOutput");
  return {
    facts: ensureStringArray(record.facts, "facts"),
    judgments: ensureStringArray(record.judgments, "judgments"),
    emotions: ensureStringArray(record.emotions, "emotions"),
    actions: ensureStringArray(record.actions, "actions"),
  };
}

export function validateBiasDetectorOutput(value: unknown): BiasDetectorOutput {
  const record = ensureRecord(value, "biasDetectorOutput");
  const bias = ensureString(record.main_bias, "main_bias");
  const normalizedBias = normalizeBiasLabel(bias);

  if (!normalizedBias) {
    throw new Error(`main_bias must be one of: ${BIAS_LABELS.join(", ")}`);
  }

  return {
    main_bias: normalizedBias,
    bias_explanation: ensureString(record.bias_explanation, "bias_explanation"),
  };
}

export function validateRuleGeneratorOutput(value: unknown): RuleGeneratorOutput {
  const record = ensureRecord(value, "ruleGeneratorOutput");
  const ruleTag = ensureString(record.rule_tag, "rule_tag");
  const normalizedRuleTag = normalizeRuleTag(ruleTag);

  if (!normalizedRuleTag) {
    throw new Error(`rule_tag must be one of: ${RULE_TAGS.join(", ")}`);
  }

  return {
    did_well: ensureString(record.did_well, "did_well"),
    rule_one: ensureString(record.rule_one, "rule_one"),
    rule_tag: normalizedRuleTag,
  };
}

export function validateReviewResult(value: unknown): ReviewResult {
  const record = ensureRecord(value, "reviewResult");
  const mainBias = ensureString(record.main_bias, "main_bias");
  const normalizedBias = normalizeBiasLabel(mainBias);

  if (!normalizedBias) {
    throw new Error(`main_bias must be one of: ${BIAS_LABELS.join(", ")}`);
  }

  return {
    emotion: ensureString(record.emotion, "emotion"),
    structured_review: validateReviewStructurerOutput(record.structured_review),
    main_bias: normalizedBias,
    did_well: ensureString(record.did_well, "did_well"),
    rule_one: ensureString(record.rule_one, "rule_one"),
    rule_tag: ensureRuleTag(record.rule_tag),
    risk_flag: ensureBoolean(record.risk_flag, "risk_flag"),
  };
}

export function validateSafetyFilterOutput(value: unknown): SafetyFilterOutput {
  const record = ensureRecord(value, "safetyFilterOutput");
  return {
    safe: ensureBoolean(record.safe, "safe"),
    cleanedResult: validateReviewResult(record.cleanedResult),
    hitRules: ensureStringArray(record.hitRules, "hitRules"),
  };
}

export function toPipelineError(
  stage: PipelineStageName,
  code: PipelineErrorCode,
  message: string,
  raw?: unknown,
  taskName?: TaskName,
): PipelineStageError {
  return new PipelineStageError({
    stage,
    code,
    message,
    raw,
    taskName,
  });
}

function ensureRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function ensureBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean.`);
  }

  return value;
}

function ensureRuleTag(value: unknown): RuleTag {
  const ruleTag = ensureString(value, "rule_tag");
  const normalizedRuleTag = normalizeRuleTag(ruleTag);

  if (!normalizedRuleTag) {
    throw new Error(`rule_tag must be one of: ${RULE_TAGS.join(", ")}`);
  }

  return normalizedRuleTag;
}

export function normalizeRuleTag(value: string): RuleTag | null {
  const normalizedInput = sanitizeBiasText(value);

  for (const [label, candidates] of RULE_TAG_NORMALIZATION_ENTRIES) {
    if (candidates.some((candidate) => sanitizeBiasText(candidate) === normalizedInput)) {
      return label;
    }
  }

  for (const [label, candidates] of RULE_TAG_NORMALIZATION_ENTRIES) {
    if (candidates.some((candidate) => normalizedInput.includes(sanitizeBiasText(candidate)))) {
      return label;
    }
  }

  return null;
}

export function inferRuleTag(mainBias: BiasLabel, ruleOne: string): RuleTag {
  const normalizedRule = sanitizeBiasText(ruleOne);

  if (includesAny(normalizedRule, ["确认", "等待"])) {
    return "wait_for_confirmation";
  }

  if (includesAny(normalizedRule, ["仓位", "减仓"])) {
    return "reduce_position";
  }

  if (includesAny(normalizedRule, ["加仓", "补仓"])) {
    return "no_unplanned_add";
  }

  if (includesAny(normalizedRule, ["追涨", "追高"])) {
    return "no_chasing";
  }

  if (includesAny(normalizedRule, ["情绪", "冲动"])) {
    return "no_emotional_order";
  }

  switch (mainBias) {
    case "追涨型冲动":
      return "no_chasing";
    case "临时加仓":
      return "no_unplanned_add";
    case "报复性交易":
      return "no_revenge_trade";
    case "盈利后膨胀":
      return "reduce_position";
    case "情绪驱动下单":
      return "no_emotional_order";
    default:
      return "wait_for_confirmation";
  }
}

function sanitizeBiasText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”"'`]/g, "")
    .replace(/[，。！？、,:：；;（）()\[\]{}\-_/]/g, "")
    .replace(/\s+/g, "");
}

function includesAny(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => source.includes(sanitizeBiasText(keyword)));
}
