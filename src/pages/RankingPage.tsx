import React, { useState } from 'react';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { openLeaderboard } from '../utils/tossGameCenter';
import { AlertModal } from '../components/AlertModal';
import { Toast } from '../components/Toast';
import './RankingPage.css';

export function RankingPage() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isOpeningLeaderboard, setIsOpeningLeaderboard] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleOpenTossLeaderboard = async () => {
    setIsOpeningLeaderboard(true);
    setRetryCount(0);
    
    try {
      const result = await openLeaderboard(
        (message) => {
          // 에러 메시지를 AlertModal로 표시
          setAlertMessage(message);
          setShowAlert(true);
        },
        (attempt, maxRetries) => {
          // 재시도 중일 때 사용자에게 알림
          setRetryCount(attempt);
          setToastMessage(`리더보드를 여는 중... (${attempt}/${maxRetries})`);
          setShowToast(true);
        }
      );
      
      // 결과가 실패이고 메시지가 없으면 기본 메시지 표시
      if (!result.success && result.message) {
        setAlertMessage(result.message);
        setShowAlert(true);
      } else if (!result.success) {
        setAlertMessage('리더보드를 열 수 없습니다.');
        setShowAlert(true);
      }
    } finally {
      setIsOpeningLeaderboard(false);
      setRetryCount(0);
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
            disabled={isOpeningLeaderboard}
          >
            {isOpeningLeaderboard 
              ? (retryCount > 0 ? `재시도 중... (${retryCount}/${2})` : '열기 중...')
              : '🏆 리더보드 보기'
            }
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
      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        icon="⏳"
      />
    </div>
  );
}
