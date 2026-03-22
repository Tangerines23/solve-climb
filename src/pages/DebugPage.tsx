import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { DummyPlayerManager } from '../components/debug/DummyPlayerManager';
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
            👥 플레이어 관리 (Dummy Manager)
          </h2>
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--rounded-card)',
            }}
          >
            <DummyPlayerManager />
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
            🔔 알림 테스트 (Notifications)
          </h2>
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
