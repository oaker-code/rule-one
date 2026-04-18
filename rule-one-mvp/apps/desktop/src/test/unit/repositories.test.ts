import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewResult, ReviewSupervisorInput } from "../../lib/pipeline/types";

const mocks = vi.hoisted(() => ({
  insertSession: vi.fn(),
  listSessions: vi.fn(),
  getById: vi.fn(),
  updateResult: vi.fn(),
  insertReflection: vi.fn(),
  findReflection: vi.fn(),
  upsertReflection: vi.fn(),
  insertRule: vi.fn(),
  findRule: vi.fn(),
  upsertRule: vi.fn(),
  getTopBiases: vi.fn(),
  getTopRuleTags: vi.fn(),
  insertAudit: vi.fn(),
  listAudit: vi.fn(),
}));

vi.mock("../../lib/db/repositories/reviewSessionRepository", () => ({
  reviewSessionRepository: {
    insert: mocks.insertSession,
    list: mocks.listSessions,
    getById: mocks.getById,
    updateResult: mocks.updateResult,
  },
}));

vi.mock("../../lib/db/repositories/reflectionCardRepository", () => ({
  reflectionCardRepository: {
    insert: mocks.insertReflection,
    findBySessionId: mocks.findReflection,
    upsertBySession: mocks.upsertReflection,
  },
}));

vi.mock("../../lib/db/repositories/ruleArchiveRepository", () => ({
  ruleArchiveRepository: {
    insert: mocks.insertRule,
    findBySessionId: mocks.findRule,
    upsertBySession: mocks.upsertRule,
    getTopBiases: mocks.getTopBiases,
    getTopRuleTags: mocks.getTopRuleTags,
  },
}));

vi.mock("../../lib/db/repositories/auditLogRepository", () => ({
  auditLogRepository: {
    insert: mocks.insertAudit,
    listBySessionId: mocks.listAudit,
  },
}));

import {
  createReviewSession,
  getHistoryBehaviorSummary,
  listHistory,
  updateReviewResult,
} from "../../lib/db/reviewPersistence";

const input: ReviewSupervisorInput = {
  emotionLabel: "焦虑",
  structuredAnswers: { note: "追高后补仓" },
  rawInput: "我追高后又补了一笔。",
};

const result: ReviewResult = {
  emotion: "焦虑",
  structured_review: {
    facts: ["追高", "补仓"],
    judgments: ["怕错过"],
    emotions: ["焦虑"],
    actions: ["买入", "补仓"],
  },
  main_bias: "追涨型冲动",
  did_well: "愿意复盘。",
  rule_one: "如果想追高，那么先等确认。",
  rule_tag: "wait_for_confirmation",
  risk_flag: false,
};

describe("reviewPersistence", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("createReviewSession persists all related records", async () => {
    const saved = await createReviewSession(input, result);

    expect(mocks.insertSession).toHaveBeenCalledTimes(1);
    expect(mocks.insertReflection).toHaveBeenCalledTimes(1);
    expect(mocks.insertRule).toHaveBeenCalledTimes(1);
    expect(mocks.insertAudit).toHaveBeenCalledTimes(1);
    expect(saved.session.session_id).toBeTruthy();
    expect(saved.session.main_bias).toBe("追涨型冲动");
    expect(saved.ruleArchive.rule_tag).toBe("wait_for_confirmation");
  });

  it("updateReviewResult updates the persisted review result", async () => {
    mocks.getById.mockResolvedValue({
      session_id: "session-1",
      review_date: "2026-04-16",
      emotion_label: "焦虑",
      raw_input: "{}",
      structured_review: "{}",
      main_bias: "追涨型冲动",
      did_well: "愿意复盘。",
      rule_one: "旧规则",
      risk_flag: 0,
      created_at: "2026-04-16T10:00:00.000Z",
    });
    mocks.findReflection.mockResolvedValue(null);
    mocks.findRule.mockResolvedValue(null);

    const updated = await updateReviewResult("session-1", input, {
      ...result,
      main_bias: "报复性交易",
      rule_one: "如果连亏后想加码，那么先暂停15分钟。",
      rule_tag: "no_revenge_trade",
    });

    expect(mocks.updateResult).toHaveBeenCalledTimes(1);
    expect(mocks.upsertReflection).toHaveBeenCalledTimes(1);
    expect(mocks.upsertRule).toHaveBeenCalledTimes(1);
    expect(mocks.insertAudit).toHaveBeenCalledTimes(1);
    expect(updated.session.main_bias).toBe("报复性交易");
    expect(updated.ruleArchive.rule_tag).toBe("no_revenge_trade");
  });

  it("listHistory maps repository rows into history summaries", async () => {
    mocks.listSessions.mockResolvedValue([
      {
        session_id: "session-2",
        review_date: "2026-04-17",
        emotion_label: "兴奋",
        raw_input: "{}",
        structured_review: "{}",
        main_bias: "盈利后膨胀",
        did_well: "有复盘。",
        rule_one: "如果连赢后想扩大仓位，那么先回到计划仓位。",
        risk_flag: 0,
        created_at: "2026-04-17T08:00:00.000Z",
      },
    ]);

    const history = await listHistory();

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      sessionId: "session-2",
      emotion: "兴奋",
      mainBias: "盈利后膨胀",
    });
  });

  it("returns top biases and top rule tags", async () => {
    mocks.getTopBiases.mockResolvedValue([
      { label: "追涨型冲动", count: 4 },
      { label: "报复性交易", count: 2 },
    ]);
    mocks.getTopRuleTags.mockResolvedValue([
      { label: "wait_for_confirmation", count: 3 },
      { label: "no_revenge_trade", count: 2 },
    ]);

    const summary = await getHistoryBehaviorSummary();

    expect(summary.topBiases[0]).toEqual({ label: "追涨型冲动", count: 4 });
    expect(summary.topRuleTags[0]).toEqual({ label: "wait_for_confirmation", count: 3 });
  });
});
