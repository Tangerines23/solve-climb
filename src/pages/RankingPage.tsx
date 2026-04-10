import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { useMemo } from 'react';
import './RankingPage.css';

function RankingComingSoon() {
  const fogIcons = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${15 + Math.random() * 20}s`,
      delay: `${-Math.random() * 20}s`,
      size: `${5 + Math.random() * 8}rem`,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="ranking-coming-soon">
      <div className="fog-overlay">
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
        <span className="maintenance-visual" aria-hidden="true">
          🏕️
        </span>
        <div className="coming-soon-badge">Coming Soon</div>
        <h2 className="maintenance-title">베이스캠프 정비 중</h2>
        <p className="maintenance-description">
          전 세계 등반가들의 기록을 안전하게 집계하기 위해
          <br />
          현재 베이스캠프를 정비하고 있습니다.
          <br />곧 정상으로 향하는 길이 다시 열립니다!
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

export function RankingPage() {
  return (
    <main className="ranking-page">
      <Header />
      <RankingComingSoon />
      <FooterNav />
    </main>
  );
}
