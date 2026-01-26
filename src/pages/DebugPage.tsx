import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DailyRewardDebugSection } from '../components/debug/DailyRewardDebugSection';
import { StaticUISection } from '../components/debug/StaticUISection';
import { NotificationPlayground } from '../components/debug/NotificationPlayground';
import { SitemapTree } from '../components/debug/SitemapTree';
import { VisualSection } from '../components/debug/VisualSection';
import './DebugPage.css';

export function DebugPage() {
  const navigate = useNavigate();

  return (
    <div className="debug-page page-container">
      <Header title="🔧 디버그 & 실험실" showBack={true} onBack={() => navigate(-1)} />

      <main
        className="debug-page-content"
        style={{
          padding: 'var(--spacing-xl)',
          paddingTop: '80px', // Header height - 고정값 허용 (디자인 레이아웃상 특수)
          paddingBottom: '120px', // 고정값 허용
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-3xl)',
          color: 'var(--color-text-primary)',
        }}
      >
        <section className="debug-section-group">
          <h2
            style={{
              borderBottom: '1px solid var(--color-bg-tertiary)',
              paddingBottom: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            🗺️ 전체 지도 (Sitemap)
          </h2>
          <SitemapTree />
        </section>

        <section className="debug-section-group">
          <h2
            style={{
              borderBottom: '1px solid var(--color-bg-tertiary)',
              paddingBottom: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            🧩 UI 실험실 (UI Lab)
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
            모달, 알림, 이펙트 등 모든 UI 요소를 이곳에서 테스트할 수 있습니다.
          </p>
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--rounded-card)',
            }}
          >
            <NotificationPlayground />
          </div>
        </section>

        <section className="debug-section-group">
          <h2
            style={{
              borderBottom: '1px solid var(--color-bg-tertiary)',
              paddingBottom: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            📱 시각적 디버그 (Visual)
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--rounded-card)',
            }}
          >
            <VisualSection />
          </div>
        </section>

        <section className="debug-section-group">
          <h2
            style={{
              borderBottom: '1px solid var(--color-bg-tertiary)',
              paddingBottom: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            🎁 일일 보상 (Daily Reward)
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--rounded-card)',
            }}
          >
            <DailyRewardDebugSection />
          </div>
        </section>

        <section className="debug-section-group">
          <h2
            style={{
              borderBottom: '1px solid var(--color-bg-tertiary)',
              paddingBottom: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-xl)',
            }}
          >
            ⚡ 정적 UI (Static Mode)
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--rounded-card)',
            }}
          >
            <StaticUISection />
          </div>
        </section>
      </main>
    </div>
  );
}
