const EMOTION_OPTIONS = ["懊悔", "焦虑", "不服气", "麻木", "兴奋", "平静"] as const;

interface EmotionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function EmotionSelector({ value, onChange }: EmotionSelectorProps) {
  return (
    <div className="section-block">
      <h2>情绪选择</h2>
      <div className="chip-grid">
        {EMOTION_OPTIONS.map((emotion) => (
          <button
            key={emotion}
            type="button"
            className={value === emotion ? "chip-button chip-button-active" : "chip-button"}
            onClick={() => onChange(emotion)}
          >
            {emotion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmotionSelector;
