import { useEffect, useState } from "react";

import HistoryList from "../components/HistoryList";
import {
  getHistoryBehaviorSummary,
  getHistoryDetail,
  listHistorySummaries,
  type HistoryBehaviorSummary,
  type HistoryDetailItem,
  type HistorySummaryItem,
} from "../lib/db/reviewPersistence";
import type { TopSummaryItem } from "../lib/db/schema";

interface HistoryPageProps {
  selectedSessionId?: string | null;
  onBackHome: () => void;
  onOpenSettings: () => void;
}

const RULE_TAG_LABELS: Record<string, string> = {
  no_chasing: "不追涨",
  no_unplanned_add: "不临时加仓",
  no_revenge_trade: "不报复性交易",
  wait_for_confirmation: "等待确认",
  reduce_position: "降低仓位",
  no_emotional_order: "不情绪化下单",
};

function HistoryPage({ selectedSessionId = null, onBackHome, onOpenSettings }: HistoryPageProps) {
  const [items, setItems] = useState<HistorySummaryItem[]>([]);
  const [behaviorSummary, setBehaviorSummary] = useState<HistoryBehaviorSummary>({ topBiases: [], topRuleTags: [] });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(selectedSessionId);
  const [detail, setDetail] = useState<HistoryDetailItem | null>(null);
  const [status, setStatus] = useState("正在读取历史记录...");

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const [summaries, summary] = await Promise.all([listHistorySummaries(), getHistoryBehaviorSummary()]);
        if (!isMounted) {
          return;
        }

        setItems(summaries);
        setBehaviorSummary(summary);
        const nextSessionId = selectedSessionId ?? summaries[0]?.sessionId ?? null;
        setActiveSessionId(nextSessionId);
        setStatus(summaries.length === 0 ? "暂无历史记录。" : "历史记录已加载。");
      } catch (error) {
        if (isMounted) {
          setStatus(error instanceof Error ? error.message : "读取历史记录失败。");
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!activeSessionId) {
        setDetail(null);
        return;
      }

      const nextDetail = await getHistoryDetail(activeSessionId);
      if (isMounted) {
        console.log("Rule One history detail:", nextDetail);
        setDetail(nextDetail);
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);

  return (
    <main className="page-shell">
      <section className="page-card">
        <div className="page-header">
          <h1>History</h1>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={onOpenSettings}>
              模型设置
            </button>
            <button type="button" className="secondary-button" onClick={onBackHome}>
              返回首页
            </button>
          </div>
        </div>
        <p className="hint">{status}</p>
        <section className="summary-grid">
          <SummaryCard title="高频偏差 Top 3" items={behaviorSummary.topBiases} />
          <SummaryCard title="高频 Rule 类型 Top 3" items={behaviorSummary.topRuleTags} formatLabel={formatRuleTagLabel} />
        </section>
        <div className="history-layout">
          <HistoryList items={items} selectedSessionId={activeSessionId} onSelect={setActiveSessionId} />
          <section className="panel-card">
            <h2>详细记录</h2>
            {!detail ? (
              <p className="empty-state">选择一条历史记录查看详细内容。</p>
            ) : (
              <div className="detail-list">
                <div>
                  <strong>日期</strong>
                  <p>{detail.session.review_date}</p>
                </div>
                <div>
                  <strong>情绪</strong>
                  <p>{detail.session.emotion_label ?? "未标记"}</p>
                </div>
                <div>
                  <strong>主偏差</strong>
                  <p>{detail.session.main_bias ?? "未分析"}</p>
                </div>
                <div>
                  <strong>Did Well</strong>
                  <p>{detail.session.did_well ?? "暂无"}</p>
                </div>
                <div>
                  <strong>Rule One</strong>
                  <p>{detail.session.rule_one ?? "暂无"}</p>
                </div>
                <div>
                  <strong>Rule Tag</strong>
                  <p>{formatRuleTagLabel(detail.ruleArchive?.rule_tag ?? null)}</p>
                </div>
                <div>
                  <strong>Structured Review</strong>
                  <pre className="raw-panel">{detail.session.structured_review ?? "{}"}</pre>
                </div>
                <div>
                  <strong>Raw Input</strong>
                  <pre className="raw-panel">{detail.session.raw_input ?? "{}"}</pre>
                </div>
                {detail.reflectionCard ? (
                  <div>
                    <strong>Reflection Card</strong>
                    <p>{detail.reflectionCard.summary ?? "暂无摘要"}</p>
                  </div>
                ) : null}
                {detail.ruleArchive ? (
                  <div>
                    <strong>Rule Archive</strong>
                    <p>{detail.ruleArchive.rule_text}</p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

interface SummaryCardProps {
  title: string;
  items: TopSummaryItem[];
  formatLabel?: (label: string | null | undefined) => string;
}

function SummaryCard({ title, items, formatLabel = defaultLabel }: SummaryCardProps) {
  return (
    <section className="panel-card">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="empty-state">最近 30 天暂无数据。</p>
      ) : (
        <div className="summary-list">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="summary-item">
              <span>{formatLabel(item.label)}</span>
              <strong>{item.count} 次</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatRuleTagLabel(value: string | null | undefined): string {
  if (!value) {
    return "暂无 Rule Tag";
  }

  return RULE_TAG_LABELS[value] ?? value;
}

function defaultLabel(value: string | null | undefined): string {
  return value && value.trim() ? value : "未标记";
}

export default HistoryPage;
