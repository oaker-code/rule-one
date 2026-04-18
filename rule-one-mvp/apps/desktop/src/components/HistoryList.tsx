import type { HistorySummaryItem } from "../lib/db/reviewPersistence";

interface HistoryListProps {
  items: HistorySummaryItem[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
}

function HistoryList({ items, selectedSessionId, onSelect }: HistoryListProps) {
  if (items.length === 0) {
    return <p className="empty-state">还没有保存过复盘记录。</p>;
  }

  return (
    <div className="history-list">
      {items.map((item) => (
        <button
          key={item.sessionId}
          type="button"
          className={selectedSessionId === item.sessionId ? "history-item history-item-active" : "history-item"}
          onClick={() => onSelect(item.sessionId)}
        >
          <strong>{item.reviewDate}</strong>
          <span>{item.emotion}</span>
          <span>{item.mainBias}</span>
          <span>{item.ruleOne}</span>
        </button>
      ))}
    </div>
  );
}

export default HistoryList;
