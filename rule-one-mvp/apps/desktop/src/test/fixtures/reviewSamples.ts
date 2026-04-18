import type { ReviewSupervisorInput } from "../../lib/pipeline/types";

export const reviewFixtures: Record<string, ReviewSupervisorInput> = {
  averagingUpChase: {
    emotionLabel: "焦虑",
    structuredAnswers: {
      trade_count: "4",
      max_position: "70%",
      max_drawdown: "-5.2%",
      biggest_plan_deviation: "追高后又临时补仓",
      strongest_emotion: "怕错过",
    },
    rawInput:
      "看到拉升后我直接追进，回落时不甘心，又补了一笔，结果仓位越来越重，完全偏离了原计划。",
  },
  revengeAfterLosses: {
    emotionLabel: "不服气",
    structuredAnswers: {
      trade_count: "9",
      max_position: "80%",
      max_drawdown: "-8.1%",
      biggest_plan_deviation: "连亏后继续重仓抢反弹",
      strongest_emotion: "想马上赚回来",
    },
    rawInput:
      "连续亏了两笔之后我很不服气，后面明显是在报复性交易，想一把扳回来，结果节奏越来越乱。",
  },
  overconfidentAfterProfit: {
    emotionLabel: "兴奋",
    structuredAnswers: {
      trade_count: "6",
      max_position: "65%",
      max_drawdown: "-2.4%",
      biggest_plan_deviation: "盈利后扩大仓位做计划外交易",
      strongest_emotion: "膨胀",
    },
    rawInput:
      "上午赚了一笔后开始有点飘，觉得今天状态很好，后面连续做了几笔计划外交易，仓位也放大了。",
  },
};
