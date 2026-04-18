import type {
  AuditLogRecord,
  ReflectionCardRecord,
  ReviewSessionRecord,
  RuleArchiveRecord,
  TopSummaryItem,
} from "./schema";
import { auditLogRepository } from "./repositories/auditLogRepository";
import { reflectionCardRepository } from "./repositories/reflectionCardRepository";
import { reviewSessionRepository } from "./repositories/reviewSessionRepository";
import { ruleArchiveRepository } from "./repositories/ruleArchiveRepository";
import type { ReviewResult, ReviewSupervisorInput } from "../pipeline/types";

export interface SavedReviewPayload {
  session: ReviewSessionRecord;
  reflectionCard: ReflectionCardRecord;
  ruleArchive: RuleArchiveRecord;
  auditLog: AuditLogRecord;
}

export interface HistorySummaryItem {
  sessionId: string;
  reviewDate: string;
  emotion: string;
  mainBias: string;
  ruleOne: string;
  createdAt: string;
}

export interface HistoryDetailItem {
  session: ReviewSessionRecord;
  reflectionCard: ReflectionCardRecord | null;
  ruleArchive: RuleArchiveRecord | null;
  auditLogs: AuditLogRecord[];
}

export interface HistoryBehaviorSummary {
  topBiases: TopSummaryItem[];
  topRuleTags: TopSummaryItem[];
}

export async function saveReviewSession(
  input: ReviewSupervisorInput,
  result: ReviewResult,
): Promise<SavedReviewPayload> {
  const createdAt = new Date().toISOString();
  const sessionId = crypto.randomUUID();

  const session: ReviewSessionRecord = {
    session_id: sessionId,
    review_date: createdAt.slice(0, 10),
    emotion_label: result.emotion,
    raw_input: JSON.stringify(input),
    structured_review: JSON.stringify(result.structured_review),
    main_bias: result.main_bias,
    did_well: result.did_well,
    rule_one: result.rule_one,
    risk_flag: result.risk_flag ? 1 : 0,
    created_at: createdAt,
  };

  const reflectionCard: ReflectionCardRecord = {
    card_id: crypto.randomUUID(),
    session_id: sessionId,
    emotion: result.emotion,
    main_bias: result.main_bias,
    did_well: result.did_well,
    rule_one: result.rule_one,
    summary: `${result.emotion} / ${result.main_bias}`,
    created_at: createdAt,
  };

  const ruleArchive: RuleArchiveRecord = {
    rule_id: crypto.randomUUID(),
    session_id: sessionId,
    rule_text: result.rule_one,
    bias_type: result.main_bias,
    rule_tag: result.rule_tag,
    status: "active",
    created_at: createdAt,
  };

  const auditLog: AuditLogRecord = {
    log_id: crypto.randomUUID(),
    session_id: sessionId,
    stage: "review_supervisor",
    input_payload: JSON.stringify(input),
    output_payload: JSON.stringify(result),
    safety_hit: result.risk_flag ? 1 : 0,
    created_at: createdAt,
  };

  await reviewSessionRepository.insert(session);
  await reflectionCardRepository.insert(reflectionCard);
  await ruleArchiveRepository.insert(ruleArchive);
  await auditLogRepository.insert(auditLog);

  return {
    session,
    reflectionCard,
    ruleArchive,
    auditLog,
  };
}

export async function createReviewSession(
  input: ReviewSupervisorInput,
  result: ReviewResult,
): Promise<SavedReviewPayload> {
  return saveReviewSession(input, result);
}

export async function updateReviewResult(
  sessionId: string,
  input: ReviewSupervisorInput,
  result: ReviewResult,
): Promise<SavedReviewPayload> {
  const existing = await reviewSessionRepository.getById(sessionId);
  const createdAt = existing?.created_at ?? new Date().toISOString();

  const session: ReviewSessionRecord = {
    session_id: sessionId,
    review_date: createdAt.slice(0, 10),
    emotion_label: result.emotion,
    raw_input: JSON.stringify(input),
    structured_review: JSON.stringify(result.structured_review),
    main_bias: result.main_bias,
    did_well: result.did_well,
    rule_one: result.rule_one,
    risk_flag: result.risk_flag ? 1 : 0,
    created_at: createdAt,
  };

  const reflectionCard: ReflectionCardRecord = {
    card_id: crypto.randomUUID(),
    session_id: sessionId,
    emotion: result.emotion,
    main_bias: result.main_bias,
    did_well: result.did_well,
    rule_one: result.rule_one,
    summary: `${result.emotion} / ${result.main_bias}`,
    created_at: createdAt,
  };

  const ruleArchive: RuleArchiveRecord = {
    rule_id: crypto.randomUUID(),
    session_id: sessionId,
    rule_text: result.rule_one,
    bias_type: result.main_bias,
    rule_tag: result.rule_tag,
    status: "active",
    created_at: createdAt,
  };

  const auditLog: AuditLogRecord = {
    log_id: crypto.randomUUID(),
    session_id: sessionId,
    stage: "review_update",
    input_payload: JSON.stringify(input),
    output_payload: JSON.stringify(result),
    safety_hit: result.risk_flag ? 1 : 0,
    created_at: new Date().toISOString(),
  };

  await reviewSessionRepository.updateResult(session);
  await reflectionCardRepository.upsertBySession(reflectionCard);
  await ruleArchiveRepository.upsertBySession(ruleArchive);
  await auditLogRepository.insert(auditLog);

  return { session, reflectionCard, ruleArchive, auditLog };
}

export async function listHistorySummaries(): Promise<HistorySummaryItem[]> {
  const sessions = await reviewSessionRepository.list();

  return sessions.map((session) => ({
    sessionId: session.session_id,
    reviewDate: session.review_date,
    emotion: session.emotion_label ?? "未标记",
    mainBias: session.main_bias ?? "未分析",
    ruleOne: session.rule_one ?? "暂无 Rule One",
    createdAt: session.created_at,
  }));
}

export async function listHistory(): Promise<HistorySummaryItem[]> {
  return listHistorySummaries();
}

export async function getHistoryBehaviorSummary(limit = 3, days = 30): Promise<HistoryBehaviorSummary> {
  const [topBiases, topRuleTags] = await Promise.all([
    ruleArchiveRepository.getTopBiases(limit, days),
    ruleArchiveRepository.getTopRuleTags(limit, days),
  ]);

  return {
    topBiases,
    topRuleTags,
  };
}

export async function getHistoryDetail(sessionId: string): Promise<HistoryDetailItem | null> {
  const session = await reviewSessionRepository.getById(sessionId);

  if (!session) {
    return null;
  }

  const [reflectionCard, ruleArchive, auditLogs] = await Promise.all([
    reflectionCardRepository.findBySessionId(sessionId),
    ruleArchiveRepository.findBySessionId(sessionId),
    auditLogRepository.listBySessionId(sessionId),
  ]);

  return {
    session,
    reflectionCard,
    ruleArchive,
    auditLogs,
  };
}
