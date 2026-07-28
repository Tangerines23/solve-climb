import './RoadmapPage.css';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { HistoryTab } from '../features/mypage/components/HistoryTab';
import '../features/mypage/pages/MyPage.css';

export function RoadmapPage() {
  return (
    <main className="history-page">
      <Header />
      <div
        className="history-main"
        style={{
          paddingTop: 'var(--header-height-portrait)',
          maxWidth: 'var(--modal-width-portrait)',
          margin: '0 auto',
        }}
      >
        <HistoryTab />
      </div>
      <FooterNav />
    </main>
  );
}
