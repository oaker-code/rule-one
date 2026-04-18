interface HomePageProps {
  onStartReview: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

function HomePage({ onStartReview, onOpenHistory, onOpenSettings }: HomePageProps) {
  return (
    <main className="page-shell">
      <section className="hero-card-simple">
        <p className="eyebrow">Rule One</p>
        <h1>收盘了，整理今天</h1>
        <div className="button-column">
          <button type="button" onClick={onStartReview}>
            开始复盘
          </button>
          <button type="button" className="secondary-button" onClick={onOpenHistory}>
            历史记录
          </button>
          <button type="button" className="secondary-button" onClick={onOpenSettings}>
            模型设置
          </button>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
