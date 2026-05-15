import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { UnderDevelopmentModal } from '@/components/UnderDevelopmentModal';
import { Toast } from '@/components/Toast';
import { useNotifications } from '@/hooks/useNotifications';
import './NotificationPage.css';

export function NotificationPage() {
  const {
    notifications,
    loading,
    unreadCount,
    markAllAsRead,
    showUnderDevelopment,
    setShowUnderDevelopment,
    showToast,
    setShowToast,
    toastMessage,
    handleNotificationClick,
    formatTimeAgo,
    getNotificationIcon,
  } = useNotifications();

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
