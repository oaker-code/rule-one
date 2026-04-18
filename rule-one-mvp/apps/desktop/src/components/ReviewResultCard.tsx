import type { ReviewResult } from "../lib/pipeline/types";

interface ReviewResultCardProps {
  result: ReviewResult;
}

function ReviewResultCard({ result }: ReviewResultCardProps) {
  return (
    <section className="panel-card">
      <h2>本次复盘结果</h2>
      <div className="detail-list">
        <div>
          <strong>Emotion</strong>
          <p>{result.emotion}</p>
        </div>
        <div>
          <strong>Main Bias</strong>
          <p>{result.main_bias}</p>
        </div>
        <div>
          <strong>Did Well</strong>
          <p>{result.did_well}</p>
        </div>
        <div>
          <strong>Rule One</strong>
          <p>{result.rule_one}</p>
        </div>
        <div>
          <strong>Rule Tag</strong>
          <p>{result.rule_tag}</p>
        </div>
        <div>
          <strong>Risk Flag</strong>
          <p>{result.risk_flag ? "是" : "否"}</p>
        </div>
      </div>
    </section>
  );
}

export default ReviewResultCard;
