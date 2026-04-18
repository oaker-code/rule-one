import type { ChatResult, TaskName } from "../../lib/llm/types";

function buildResult(taskName: TaskName, content: string): ChatResult {
  return {
    ok: true,
    provider: "mock",
    model: `mock-${taskName}`,
    taskName,
    content,
  };
}

export function createMockChatImplementation() {
  return async ({ taskName }: { taskName: TaskName }) => {
    switch (taskName) {
      case "emotion_detect":
        return buildResult(
          taskName,
          JSON.stringify({
            emotion: "焦虑",
            interaction_tone: "冷静、直接、面向行动",
          }),
        );
      case "review_structuring":
        return buildResult(
          taskName,
          JSON.stringify({
            facts: ["开盘后追高买入", "回落后继续加仓"],
            judgments: ["担心错过机会", "想快速把亏损赚回来"],
            emotions: ["焦虑", "不甘心"],
            actions: ["追高", "补仓", "没有止损"],
          }),
        );
      case "bias_detect":
        return buildResult(
          taskName,
          JSON.stringify({
            main_bias: "报复性交易",
            bias_explanation: "连续亏损后试图快速扳回，导致节奏失控。",
          }),
        );
      case "rule_generate":
        return buildResult(
          taskName,
          JSON.stringify({
            did_well: "愿意复盘并承认执行偏差。",
            rule_one: "如果连亏后想加码，那么先暂停15分钟再决定。",
            rule_tag: "no_revenge_trade",
          }),
        );
      case "safety_filter":
        return buildResult(
          taskName,
          JSON.stringify({
            safe: false,
            cleanedResult: {
              emotion: "焦虑",
              structured_review: {
                facts: ["开盘后追高买入", "回落后继续加仓"],
                judgments: ["担心错过机会"],
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
        );
      default:
        return buildResult(
          taskName,
          JSON.stringify({
            emotion: "焦虑",
            structured_review: {
              facts: ["开盘后追高买入"],
              judgments: ["担心错过机会"],
              emotions: ["焦虑"],
              actions: ["追高"],
            },
            main_bias: "报复性交易",
            did_well: "愿意复盘并承认执行偏差。",
            rule_one: "如果连亏后想加码，那么先暂停15分钟再决定。",
            rule_tag: "no_revenge_trade",
            risk_flag: false,
          }),
        );
    }
  };
}
