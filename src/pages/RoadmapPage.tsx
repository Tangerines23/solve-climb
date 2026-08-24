import './RoadmapPage.css';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';

const FOG_ICONS = Array.from({ length: 24 }).map((_, i) => ({
  id: i,
  left: `${(i * 17 + 5) % 100}%`,
  top: `${(i * 29 + 11) % 100}%`,
  duration: `${15 + ((i * 7) % 20)}s`,
  delay: `${-((i * 11) % 20)}s`,
  size: `${5 + ((i * 3) % 8)}rem`,
  opacity: 0.3 + ((i * 5) % 40) / 100,
}));

function RoadmapComingSoon() {
  return (
    <div className="roadmap-coming-soon ranking-coming-soon">
      <div className="fog-overlay">
        {FOG_ICONS.map((fog) => (
          <span
            key={fog.id}
            className="fog-icon"
            aria-hidden="true"
            style={{
              left: fog.left,
              top: fog.top,
              animationDuration: fog.duration,
              animationDelay: fog.delay,
              fontSize: fog.size,
              opacity: fog.opacity,
            }}
          >
            ☁️
          </span>
        ))}
      </div>

      <div className="maintenance-card">
        <span className="maintenance-visual" aria-hidden="true">
          🗺️
        </span>
        <div className="coming-soon-badge">Coming Soon</div>
        <h2 className="maintenance-title">일지 기록소 정비 중</h2>
        <p className="maintenance-description">
          등반가님의 소중한 기록을 더 멋지게 시각화하기 위해
          <br />
          일지 시스템을 개선하고 있습니다.
          <br />곧 상세한 분석 리포트와 함께 돌아올게요!
        </p>
        <div style={{ opacity: 0.5 }}>
          <span className="gear-icon" aria-hidden="true">
            ⚒️
          </span>
        </div>
      </div>
    </div>
  );
}

export function RoadmapPage() {
  return (
    <main className="history-page">
      <Header />
      <RoadmapComingSoon />
      <FooterNav />
    </main>
  );
}
