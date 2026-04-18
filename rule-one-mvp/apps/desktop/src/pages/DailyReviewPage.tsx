import { useState } from "react";

import EmotionSelector from "../components/EmotionSelector";
import FixedQuestionForm, { type FixedQuestionValues } from "../components/FixedQuestionForm";
import { run } from "../lib/pipeline/reviewSupervisor";
import { PipelineStageError, type ReviewResult, type ReviewSupervisorInput } from "../lib/pipeline/types";

interface DailyReviewPageProps {
  onBackHome: () => void;
  onReviewComplete: (input: ReviewSupervisorInput, result: ReviewResult) => void;
}

const INITIAL_FIXED_QUESTIONS: FixedQuestionValues = {
  tradeCount: "",
  maxPosition: "",
  maxDrawdown: "",
  biggestPlanDeviation: "",
  strongestEmotion: "",
};

function DailyReviewPage({ onBackHome, onReviewComplete }: DailyReviewPageProps) {
  const [emotionLabel, setEmotionLabel] = useState("平静");
  const [fixedQuestions, setFixedQuestions] = useState(INITIAL_FIXED_QUESTIONS);
  const [rawInput, setRawInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!rawInput.trim()) {
      setErrorMessage("请先填写自由文本输入，再提交复盘。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const input: ReviewSupervisorInput = {
      emotionLabel,
      structuredAnswers: {
        today_trade_count: fixedQuestions.tradeCount,
        max_position: fixedQuestions.maxPosition,
        max_drawdown: fixedQuestions.maxDrawdown,
        biggest_plan_deviation: fixedQuestions.biggestPlanDeviation,
        strongest_emotion: fixedQuestions.strongestEmotion,
      },
      rawInput,
    };

    try {
      console.log("Rule One DailyReview submit:", input);
      const result = await run(input);
      console.log("Rule One DailyReview result:", result);
      onReviewComplete(input, result);
    } catch (error) {
      console.error("Rule One DailyReview submit failed:", error);
      setErrorMessage(formatReviewError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <h1>Daily Review</h1>
          <button type="button" className="secondary-button" onClick={onBackHome}>
            返回首页
          </button>
        </div>
        <EmotionSelector value={emotionLabel} onChange={setEmotionLabel} />
        <FixedQuestionForm value={fixedQuestions} onChange={setFixedQuestions} />
        <div className="section-block">
          <h2>自由文本输入</h2>
          <label className="field">
            <span>今天最想复盘的过程</span>
            <textarea rows={8} value={rawInput} onChange={(event) => setRawInput(event.currentTarget.value)} />
          </label>
        </div>
        {errorMessage ? <p className="result-error">Error: {errorMessage}</p> : null}
        <div className="button-row">
          <button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "生成中..." : "提交"}
          </button>
        </div>
      </section>
    </main>
  );
}

function formatReviewError(error: unknown): string {
  if (error instanceof PipelineStageError) {
    const segments = [
      `Stage: ${error.details.stage}`,
      error.details.taskName ? `Task: ${error.details.taskName}` : null,
      `Message: ${error.details.message}`,
    ].filter(Boolean);

    return segments.join(" | ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Review failed. Please check the model configuration and try again.";
}

export default DailyReviewPage;
