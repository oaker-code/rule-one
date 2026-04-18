import { beforeEach, describe, expect, it, vi } from "vitest";

import { reviewFixtures } from "../fixtures/reviewSamples";

const { chatMock } = vi.hoisted(() => ({
  chatMock: vi.fn(),
}));

vi.mock("../../lib/llm/modelGateway", () => ({
  chat: chatMock,
}));

import { biasDetector } from "../../lib/pipeline/biasDetector";
import { run } from "../../lib/pipeline/reviewSupervisor";
import { ruleGenerator } from "../../lib/pipeline/ruleGenerator";
import { safetyFilter } from "../../lib/pipeline/safetyFilter";
import { inferRuleTag, normalizeBiasLabel } from "../../lib/pipeline/types";

describe("pipeline", () => {
  beforeEach(() => {
    chatMock.mockReset();
    chatMock.mockImplementation(async (request: { taskName: string; messages: Array<{ content: string }> }) => {
      const systemPrompt = request.messages[0]?.content ?? "";

      if (request.taskName === "emotion_detect") {
        return {
          ok: true,
          provider: "mock",
          model: "mock-emotion",
          taskName: "emotion_detect",
          content: JSON.stringify({
            emotion: "焦虑",
            interaction_tone: "冷静、直接、面向行动",
          }),
        };
      }

      if (request.taskName === "review_structuring" && systemPrompt.includes("Self Respect Rewrite")) {
        return {
          ok: true,
          provider: "mock",
          model: "mock-rewrite",
          taskName: "review_structuring",
          content: JSON.stringify({
            emotion: "焦虑",
            structured_review: {
              facts: ["开盘后追高买入", "回落后补仓"],
              judgments: ["这是一个可修复的行为偏差"],
              emotions: ["焦虑"],
              actions: ["追高", "补仓"],
            },
            main_bias: "报复性交易",
            did_well: "愿意复盘并承认执行偏差。",
            rule_one: "如果连亏后想加码，那么先暂停15分钟再决定。",
            rule_tag: "no_revenge_trade",
            risk_flag: false,
          }),
        };
      }

      if (request.taskName === "review_structuring") {
        return {
          ok: true,
          provider: "mock",
          model: "mock-structurer",
          taskName: "review_structuring",
          content: JSON.stringify({
            facts: ["开盘后追高买入", "回落后补仓"],
            judgments: ["担心错过机会"],
            emotions: ["焦虑"],
            actions: ["追高", "补仓"],
          }),
        };
      }

      if (request.taskName === "bias_detect") {
        return {
          ok: true,
          provider: "mock",
          model: "mock-bias",
          taskName: "bias_detect",
          content: JSON.stringify({
            main_bias: "报复交易",
            bias_explanation: "连续亏损后想快速扳回。",
          }),
        };
      }

      if (request.taskName === "rule_generate") {
        return {
          ok: true,
          provider: "mock",
          model: "mock-rule",
          taskName: "rule_generate",
          content: JSON.stringify({
            did_well: "愿意复盘并承认执行偏差。",
            rule_one: "如果连亏后想加码，那么先暂停15分钟再决定。",
            rule_tag: "no_revenge_trade",
          }),
        };
      }

      return {
        ok: true,
        provider: "mock",
        model: "mock-safety",
        taskName: "safety_filter",
        content: JSON.stringify({
          safe: false,
          cleanedResult: {
            emotion: "焦虑",
            structured_review: {
              facts: ["开盘后追高买入", "回落后补仓"],
              judgments: ["这是一个可修复的行为偏差"],
              emotions: ["焦虑"],
              actions: ["追高", "补仓"],
            },
            main_bias: "报复性交易",
            did_well: "愿意复盘并承认执行偏差。",
            rule_one: "如果连亏后想加码，那么先暂停15分钟再决定。",
            rule_tag: "no_revenge_trade",
            risk_flag: false,
          },
          hitRules: ["BUY_SELL_ADVICE"],
        }),
      };
    });
  });

  it("reviewSupervisor.run returns the expected schema", async () => {
    const result = await run(reviewFixtures.revengeAfterLosses);

    expect(result).toMatchObject({
      emotion: expect.any(String),
      main_bias: expect.any(String),
      did_well: expect.any(String),
      rule_one: expect.any(String),
      rule_tag: expect.any(String),
      risk_flag: expect.any(Boolean),
    });
    expect(Array.isArray(result.structured_review.facts)).toBe(true);
  });

  it("Bias Detector only outputs one main bias", async () => {
    const result = await biasDetector({
      structured_review: {
        facts: ["连续亏损后加大仓位"],
        judgments: ["想马上赚回来"],
        emotions: ["不服气"],
        actions: ["重仓追单"],
      },
    });

    expect(result.main_bias).toBe("报复性交易");
    expect(result.main_bias.includes("，")).toBe(false);
  });

  it("normalizes bias label variants to one allowed label", () => {
    expect(normalizeBiasLabel("报复交易")).toBe("报复性交易");
    expect(normalizeBiasLabel(" 追高冲动 ")).toBe("追涨型冲动");
    expect(normalizeBiasLabel("计划外下单")).toBe("计划外交易");
  });

  it("infers a stable rule tag", () => {
    expect(inferRuleTag("追涨型冲动", "如果想追高，那么先等待确认。")).toBe("wait_for_confirmation");
    expect(inferRuleTag("报复性交易", "如果连亏后想加码，那么暂停15分钟。")).toBe("no_revenge_trade");
  });

  it("Rule Generator only outputs one actionable Rule One", async () => {
    const result = await ruleGenerator({
      main_bias: "报复性交易",
      structured_review: {
        facts: ["连续亏损后加大仓位"],
        judgments: ["想马上赚回来"],
        emotions: ["不服气"],
        actions: ["重仓追单"],
      },
    });

    expect(result.rule_one).toContain("如果");
    expect(result.rule_tag).toBe("no_revenge_trade");
    expect(result.rule_one.split(/[。！？!?.]/).filter(Boolean)).toHaveLength(1);
  });

  it("Safety Filter intercepts out-of-bound content", async () => {
    const result = await safetyFilter({
      emotion: "焦虑",
      structured_review: {
        facts: ["建议明天继续买入某只股票"],
        judgments: ["觉得它一定会涨"],
        emotions: ["兴奋"],
        actions: ["继续加仓"],
      },
      main_bias: "报复性交易",
      did_well: "愿意复盘。",
      rule_one: "如果想买入某只股票，那么立刻重仓。",
      rule_tag: "no_revenge_trade",
      risk_flag: false,
    });

    expect(result.safe).toBe(false);
    expect(result.cleanedResult.rule_tag).toBe("no_revenge_trade");
    expect(result.hitRules).toContain("BUY_SELL_ADVICE");
  });
});
