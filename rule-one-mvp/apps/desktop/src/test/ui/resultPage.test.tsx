import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderPage } from "../helpers/render";
import ResultPage from "../../pages/ResultPage";

describe("ResultPage", () => {
  it("shows emotion, main_bias, did_well and rule_one", () => {
    renderPage(
      <ResultPage
        draftInput={{ emotionLabel: "焦虑", rawInput: "raw", structuredAnswers: {} }}
        draftResult={{
          emotion: "焦虑",
          structured_review: { facts: [], judgments: [], emotions: [], actions: [] },
          main_bias: "追涨型冲动",
          did_well: "愿意复盘。",
          rule_one: "如果想追高，那么先等确认。",
          rule_tag: "wait_for_confirmation",
          risk_flag: false,
        }}
        onBackHome={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(screen.getByText("焦虑")).toBeInTheDocument();
    expect(screen.getByText("追涨型冲动")).toBeInTheDocument();
    expect(screen.getByText("愿意复盘。")).toBeInTheDocument();
    expect(screen.getByText("如果想追高，那么先等确认。")).toBeInTheDocument();
    expect(screen.getByText("wait_for_confirmation")).toBeInTheDocument();
  });
});
