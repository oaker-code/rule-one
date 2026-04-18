import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderPage } from "../helpers/render";

const { listHistorySummariesMock, getHistoryDetailMock, getHistoryBehaviorSummaryMock } = vi.hoisted(() => ({
  listHistorySummariesMock: vi.fn(),
  getHistoryDetailMock: vi.fn(),
  getHistoryBehaviorSummaryMock: vi.fn(),
}));

vi.mock("../../lib/db/reviewPersistence", () => ({
  listHistorySummaries: listHistorySummariesMock,
  getHistoryDetail: getHistoryDetailMock,
  getHistoryBehaviorSummary: getHistoryBehaviorSummaryMock,
}));

import HistoryPage from "../../pages/HistoryPage";

describe("HistoryPage", () => {
  it("shows empty state", async () => {
    listHistorySummariesMock.mockResolvedValue([]);
    getHistoryDetailMock.mockResolvedValue(null);
    getHistoryBehaviorSummaryMock.mockResolvedValue({ topBiases: [], topRuleTags: [] });

    renderPage(<HistoryPage onBackHome={vi.fn()} onOpenSettings={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("还没有保存过复盘记录。")).toBeInTheDocument();
      expect(screen.getAllByText("最近 30 天暂无数据。")).toHaveLength(2);
    });
  });

  it("shows history list, summary cards and selected detail", async () => {
    listHistorySummariesMock.mockResolvedValue([
      {
        sessionId: "session-1",
        reviewDate: "2026-04-16",
        emotion: "焦虑",
        mainBias: "报复性交易",
        ruleOne: "如果连亏后想加码，那么先暂停15分钟。",
        createdAt: "2026-04-16T08:00:00.000Z",
      },
    ]);
    getHistoryBehaviorSummaryMock.mockResolvedValue({
      topBiases: [
        { label: "报复性交易", count: 2 },
        { label: "追涨型冲动", count: 1 },
      ],
      topRuleTags: [
        { label: "no_revenge_trade", count: 2 },
        { label: "wait_for_confirmation", count: 1 },
      ],
    });
    getHistoryDetailMock.mockResolvedValue({
      session: {
        session_id: "session-1",
        review_date: "2026-04-16",
        emotion_label: "焦虑",
        raw_input: '{"raw":true}',
        structured_review: '{"facts":[]}',
        main_bias: "报复性交易",
        did_well: "愿意复盘。",
        rule_one: "如果连亏后想加码，那么先暂停15分钟。",
        risk_flag: 0,
        created_at: "2026-04-16T08:00:00.000Z",
      },
      reflectionCard: null,
      ruleArchive: {
        rule_id: "rule-1",
        session_id: "session-1",
        rule_text: "如果连亏后想加码，那么先暂停15分钟。",
        bias_type: "报复性交易",
        rule_tag: "no_revenge_trade",
        status: "active",
        created_at: "2026-04-16T08:00:00.000Z",
      },
      auditLogs: [],
    });

    renderPage(<HistoryPage onBackHome={vi.fn()} onOpenSettings={vi.fn()} />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("高频偏差 Top 3")).toBeInTheDocument();
      expect(screen.getByText("高频 Rule 类型 Top 3")).toBeInTheDocument();
      expect(screen.getByText("不报复性交易")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /2026-04-16/i }));

    await waitFor(() => {
      expect(screen.getByText("详细记录")).toBeInTheDocument();
      expect(screen.getAllByText("报复性交易").length).toBeGreaterThan(0);
      expect(screen.getAllByText("不报复性交易").length).toBeGreaterThan(0);
    });
  });
});
