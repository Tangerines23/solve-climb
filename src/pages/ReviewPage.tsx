import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { MyPageTipPreview } from '../components/my/MyPageTipPreview';
import { urls } from '../utils/navigation';
import './ReviewPage.css';

export function ReviewPage() {
  const navigate = useNavigate();

  return (
    <div className="review-page">
      <Header title="예습 복습" showBack={true} onBack={() => navigate(urls.myPage())} />
      <main className="review-page-main">
        <div className="review-page-container">
          <MyPageTipPreview />
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
