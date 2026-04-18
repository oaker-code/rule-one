export interface FixedQuestionValues {
  tradeCount: string;
  maxPosition: string;
  maxDrawdown: string;
  biggestPlanDeviation: string;
  strongestEmotion: string;
}

interface FixedQuestionFormProps {
  value: FixedQuestionValues;
  onChange: (nextValue: FixedQuestionValues) => void;
}

function FixedQuestionForm({ value, onChange }: FixedQuestionFormProps) {
  function updateField(field: keyof FixedQuestionValues, fieldValue: string) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  return (
    <div className="section-block">
      <h2>固定问题表单</h2>
      <label className="field">
        <span>今天做了几笔</span>
        <input value={value.tradeCount} onChange={(event) => updateField("tradeCount", event.currentTarget.value)} />
      </label>
      <label className="field">
        <span>最大仓位是多少</span>
        <input value={value.maxPosition} onChange={(event) => updateField("maxPosition", event.currentTarget.value)} />
      </label>
      <label className="field">
        <span>最大回撤是多少</span>
        <input value={value.maxDrawdown} onChange={(event) => updateField("maxDrawdown", event.currentTarget.value)} />
      </label>
      <label className="field">
        <span>最偏离计划的一笔是哪笔</span>
        <textarea
          rows={3}
          value={value.biggestPlanDeviation}
          onChange={(event) => updateField("biggestPlanDeviation", event.currentTarget.value)}
        />
      </label>
      <label className="field">
        <span>今天最强烈的情绪是什么</span>
        <input
          value={value.strongestEmotion}
          onChange={(event) => updateField("strongestEmotion", event.currentTarget.value)}
        />
      </label>
    </div>
  );
}

export default FixedQuestionForm;
