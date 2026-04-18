import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderPage } from "../helpers/render";

const { runMock } = vi.hoisted(() => ({
  runMock: vi.fn(),
}));

vi.mock("../../lib/pipeline/reviewSupervisor", () => ({
  run: runMock,
}));

import DailyReviewPage from "../../pages/DailyReviewPage";

describe("DailyReviewPage", () => {
  it("fills the form and submits", async () => {
    const onReviewComplete = vi.fn();
    runMock.mockResolvedValue({
      emotion: "焦虑",
      structured_review: { facts: [], judgments: [], emotions: [], actions: [] },
      main_bias: "追涨型冲动",
      did_well: "愿意复盘。",
      rule_one: "如果想追高，那么先等确认。",
      rule_tag: "wait_for_confirmation",
      risk_flag: false,
    });

    renderPage(<DailyReviewPage onBackHome={vi.fn()} onReviewComplete={onReviewComplete} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "焦虑" }));
    await user.type(screen.getByLabelText("今天做了几笔"), "4");
    await user.type(screen.getByLabelText("最大仓位是多少"), "70%");
    await user.type(screen.getByLabelText("最大回撤是多少"), "-5%");
    await user.type(screen.getByLabelText("最偏离计划的一笔是哪笔"), "追高后补仓");
    await user.type(screen.getByLabelText("今天最强烈的情绪是什么"), "怕错过");
    await user.type(screen.getByLabelText("今天最想复盘的过程"), "看到拉升后我直接追进，回落时又补仓。");
    await user.click(screen.getByRole("button", { name: "提交" }));

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(onReviewComplete).toHaveBeenCalledTimes(1);
  });
});
