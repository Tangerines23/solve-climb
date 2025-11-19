// src/pages/NotificationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
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

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`${APP_CONFIG.API_BASE_URL}/notifications`);
      // const data = await response.json();

      // 임시 데이터
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'record_broken',
          title: '누군가 내 기록을 깼어요!',
          message: '수학천재님이 수학 - 사칙연산 Level 1의 최고 기록을 갱신했습니다.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
          read: false,
          category: 'math',
          subCategory: 'arithmetic',
          level: 1,
          challengerName: '수학천재',
        },
        {
          id: '2',
          type: 'challenge',
          title: '오늘의 챌린지가 도착했습니다',
          message: '사칙연산 스피드런! 챌린지를 완료하고 보상을 받아보세요.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5시간 전
          read: false,
          challengeId: APP_CONFIG.TODAY_CHALLENGE.id,
        },
        {
          id: '3',
          type: 'record_broken',
          title: '누군가 내 기록을 깼어요!',
          message: '퀴즈킹님이 언어 - 히라가나 Level 3의 최고 기록을 갱신했습니다.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
          read: true,
          category: 'language',
          subCategory: 'hiragana',
          level: 3,
          challengerName: '퀴즈킹',
        },
        {
          id: '4',
          type: 'challenge',
          title: '오늘의 챌린지가 도착했습니다',
          message: '새로운 챌린지가 준비되었습니다. 도전해보세요!',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2일 전
          read: true,
          challengeId: 'challenge_002',
        },
      ];

      setNotifications(mockNotifications);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  };

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
  );
}

