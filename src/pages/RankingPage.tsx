import React, { useState } from 'react';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { openLeaderboard } from '../utils/tossGameCenter';
import { AlertModal } from '../components/AlertModal';
import './RankingPage.css';

export function RankingPage() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleOpenTossLeaderboard = async () => {
    const result = await openLeaderboard((message) => {
      // 에러 메시지를 AlertModal로 표시
      setAlertMessage(message);
      setShowAlert(true);
    });
    
    // 결과가 실패이고 메시지가 없으면 기본 메시지 표시
    if (!result.success && result.message) {
      setAlertMessage(result.message);
      setShowAlert(true);
    } else if (!result.success) {
      setAlertMessage('리더보드를 열 수 없습니다.');
      setShowAlert(true);
    }
  };

  return (
    <div className="ranking-page">
      <Header />
      <main className="ranking-main">
        <div className="ranking-content">
          <h1 className="ranking-title">리더보드</h1>

          {/* 토스 리더보드 열기 버튼 */}
          <button 
            className="toss-leaderboard-button"
            onClick={handleOpenTossLeaderboard}
          >
            🏆 리더보드 보기
          </button>

          <div className="ranking-empty">
            <p>토스 앱에서 리더보드를 확인하세요</p>
          </div>
        </div>
      </main>
      <FooterNav />
      <AlertModal
        isOpen={showAlert}
        title="알림"
        message={alertMessage || '리더보드를 열 수 없습니다.'}
        onClose={() => setShowAlert(false)}
      />
    </div>
  );
}
