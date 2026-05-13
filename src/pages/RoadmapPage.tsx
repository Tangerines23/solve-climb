import { useMemo } from 'react';
import './RoadmapPage.css';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { useSeededRandom } from '@/hooks/useSeededRandom';

function RoadmapComingSoon() {
  const rng = useSeededRandom('roadmap-fog');
  const fogIcons = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${rng.next() * 100}%`,
      top: `${rng.next() * 100}%`,
      duration: `${15 + rng.next() * 20}s`,
      delay: `${-rng.next() * 20}s`,
      size: `${5 + rng.next() * 8}rem`,
      opacity: 0.3 + rng.next() * 0.4,
    }));
  }, []);

  return (
    <div className="history-coming-soon">
      <div className="fog-overlay" data-vg-ignore="true">
        {fogIcons.map((fog) => (
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
        <span className="maintenance-visual" aria-hidden="true" data-vg-ignore="true">
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
        <div style={{ opacity: 0.5 }} data-vg-ignore="true">
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
