import { useState } from "react";

import ReviewResultCard from "../components/ReviewResultCard";
import { saveReviewSession } from "../lib/db/reviewPersistence";
import type { ReviewResult, ReviewSupervisorInput } from "../lib/pipeline/types";

interface ResultPageProps {
  draftInput: ReviewSupervisorInput | null;
  draftResult: ReviewResult | null;
  onBackHome: () => void;
  onViewHistory: (sessionId?: string) => void;
}

function ResultPage({ draftInput, draftResult, onBackHome, onViewHistory }: ResultPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  if (!draftInput || !draftResult) {
    return (
      <main className="page-shell">
        <section className="page-card">
          <h1>Result</h1>
          <p className="empty-state">当前没有待查看的复盘结果，请先完成一次 Daily Review。</p>
          <button type="button" onClick={onBackHome}>
            返回首页
          </button>
        </section>
      </main>
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const saved = await saveReviewSession(draftInput!, draftResult!);
      console.log("Rule One saved review session:", saved);
      setSavedSessionId(saved.session.session_id);
      setSaveMessage("本次复盘已保存到本地 SQLite。");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <h1>Result</h1>
          <button type="button" className="secondary-button" onClick={onBackHome}>
            返回首页
          </button>
        </div>
        <ReviewResultCard result={draftResult} />
        {saveMessage ? <p className={savedSessionId ? "result-success" : "result-error"}>{saveMessage}</p> : null}
        <div className="button-row">
          <button type="button" onClick={() => void handleSave()} disabled={isSaving || Boolean(savedSessionId)}>
            {savedSessionId ? "已保存" : isSaving ? "保存中..." : "保存本次复盘"}
          </button>
          <button type="button" className="secondary-button" onClick={() => onViewHistory(savedSessionId ?? undefined)}>
            查看历史
          </button>
          <button type="button" className="secondary-button" onClick={onBackHome}>
            返回首页
          </button>
        </div>
      </section>
    </main>
  );
}

export default ResultPage;
