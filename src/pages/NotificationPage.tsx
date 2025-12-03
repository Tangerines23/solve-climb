// src/pages/NotificationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { UnderDevelopmentModal } from '../components/UnderDevelopmentModal';
import { Toast } from '../components/Toast';
import { APP_CONFIG } from '../config/app';
import './NotificationPage.css';

export type NotificationType = 'record_broken' | 'challenge';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: string;
  subCategory?: string;
  level?: number;
  challengerName?: string;
  challengeId?: string;
}

export function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnderDevelopment, setShowUnderDevelopment] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  useEffect(() => {
    // 알림 데이터는 백엔드 서버 없이 사용할 수 없으므로 빈 배열로 설정
    setLoading(false);
    setNotifications([]);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // 알림 읽음 처리
    if (!notification.read) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    // 알림 타입에 따라 다른 페이지로 이동
    if (notification.type === 'challenge' && notification.challengeId) {
      navigate(`/challenge?id=${notification.challengeId}`);
    } else if (notification.type === 'record_broken') {
      // 기록이 깨진 레벨로 이동
      if (notification.category && notification.subCategory && notification.level) {
        navigate(
          `/level-select?category=${notification.category}&sub=${notification.subCategory}`
        );
      }
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'record_broken':
        return '🏆';
      case 'challenge':
        return '🎯';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
                <button className="mark-all-read-button" onClick={handleMarkAllAsRead}>
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
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
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

