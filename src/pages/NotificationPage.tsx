// src/pages/NotificationPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { UnderDevelopmentModal } from '../components/UnderDevelopmentModal';
import { Toast } from '../components/Toast';
import { urls } from '../utils/navigation';
import { useNotificationStore, Notification } from '../stores/useNotificationStore';
import './NotificationPage.css';

export function NotificationPage() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, setLoading } =
    useNotificationStore();

  const [showUnderDevelopment, setShowUnderDevelopment] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage] = useState('');

  useEffect(() => {
    // 알림 데이터는 백엔드 서버 없이 사용할 수 없으므로 목 데이터로 설정
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'record_broken',
        title: '신기록 달성!',
        message: '산수 World 1 - 덧셈 1단계에서 새로운 신기록을 세웠습니다!',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5분 전
        read: false,
        category: 'math',
        subCategory: 'basic',
        level: 1,
      },
      {
        id: '2',
        type: 'challenge',
        title: '도전장 도착',
        message: 'Tangerine23님이 당신에게 산수 대결 도전장을 보냈습니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
        read: false,
        challengerName: 'Tangerine23',
        challengeId: 'challenge-123',
      },
      {
        id: '3',
        type: 'record_broken',
        title: '기록 경신 알림',
        message: '도형 World 1 - 각도 2단계 기록이 다른 플레이어에 의해 깨졌습니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
        read: true,
        category: 'math',
        subCategory: 'geometry',
        level: 2,
      },
    ];

    if (notifications.length === 0) {
      useNotificationStore.getState().setNotifications(mockNotifications);
    }
    setLoading(false);
  }, [setLoading, notifications.length]);

  const handleNotificationClick = (notification: Notification) => {
    // 알림 읽음 처리
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 알림 타입에 따라 다른 페이지로 이동
    if (notification.type === 'challenge' && notification.challengeId) {
      navigate(urls.challenge({ id: notification.challengeId }));
    } else if (notification.type === 'record_broken') {
      // 기록이 깨진 레벨로 이동
      if (notification.category && notification.subCategory && notification.level) {
        const mountain = notification.category || 'math';
        const world = 'World1'; // 기본 월드
        const category = notification.subCategory;
        navigate(
          urls.levelSelect({
            mountain,
            world,
            category,
          })
        );
      }
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'record_broken':
        return '🏆';
      case 'challenge':
        return '🎯';
      default:
        return '🔔';
    }
  };

  return (
    <>
      <UnderDevelopmentModal
        isOpen={showUnderDevelopment}
        onClose={() => setShowUnderDevelopment(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
      <div className="notification-page">
        <Header />
        <main className="notification-main">
          <div className="notification-content">
            <div className="notification-header">
              <h1 className="notification-title">알림</h1>
              {unreadCount > 0 && (
                <button className="mark-all-read-button" onClick={markAllAsRead}>
                  모두 읽음
                </button>
              )}
            </div>

            {loading ? (
              <div className="notification-loading">
                <p>알림을 불러오는 중...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">🔔</div>
                <p className="notification-empty-text">알림이 없습니다</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content-wrapper">
                      <div className="notification-item-header">
                        <h3 className="notification-item-title">{notification.title}</h3>
                        {!notification.read && <span className="notification-unread-dot"></span>}
                      </div>
                      <p className="notification-item-message">{notification.message}</p>
                      <span className="notification-item-time">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <FooterNav />
      </div>
      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        icon="⚠️"
      />
    </>
  );
}
