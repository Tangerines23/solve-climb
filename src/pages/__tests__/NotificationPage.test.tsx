import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPage } from '../NotificationPage';
import { BrowserRouter } from 'react-router-dom';
import { useNotificationStore } from '../../stores/useNotificationStore';
import '@testing-library/jest-dom/vitest';

// Mock dependencies
vi.mock('../../stores/useNotificationStore');
vi.mock('../../components/Header', () => ({ Header: () => <div data-testid="header" /> }));
vi.mock('../../components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav" />,
}));
vi.mock('../../components/UnderDevelopmentModal', () => ({
  UnderDevelopmentModal: () => <div data-testid="dev-modal" />,
}));
vi.mock('../../components/Toast', () => ({ Toast: () => <div data-testid="toast" /> }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationPage', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'record_broken',
      title: 'Record Broken',
      message: 'Someone beat your score!',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
      read: false,
      category: 'math',
      subCategory: '基礎',
      level: 1,
    },
    {
      id: '2',
      type: 'challenge',
      title: 'New Challenge',
      message: 'You have been challenged!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      read: true,
      challengeId: 'challenge-123',
    },
  ];

  const defaultStore = {
    notifications: [],
    loading: false,
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    setLoading: vi.fn(),
    setNotifications: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(defaultStore);
      return defaultStore;
    });
    (useNotificationStore as any).getState = () => defaultStore;
  });

  it('should render empty state when no notifications', () => {
    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    expect(screen.getByText('알림이 없습니다')).toBeInTheDocument();
  });

  it('should render list of notifications', () => {
    const storeWithData = { ...defaultStore, notifications: mockNotifications, unreadCount: 1 };
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(storeWithData);
      return storeWithData;
    });
    (useNotificationStore as any).getState = () => storeWithData;

    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Record Broken')).toBeInTheDocument();
    expect(screen.getByText('New Challenge')).toBeInTheDocument();
    expect(screen.getByText('5분 전')).toBeInTheDocument();
  });

  it('should handle notification click (record_broken)', () => {
    const storeWithData = { ...defaultStore, notifications: mockNotifications, unreadCount: 1 };
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(storeWithData);
      return storeWithData;
    });
    (useNotificationStore as any).getState = () => storeWithData;

    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    const item = screen.getByTestId('notification-item-1');
    fireEvent.click(item);

    expect(storeWithData.markAsRead).toHaveBeenCalledWith('1');
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/level-select'));
  });

  it('should handle notification click (challenge)', () => {
    const storeWithData = { ...defaultStore, notifications: mockNotifications, unreadCount: 1 };
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(storeWithData);
      return storeWithData;
    });
    (useNotificationStore as any).getState = () => storeWithData;

    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    const item = screen.getByTestId('notification-item-2');
    fireEvent.click(item);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/challenge?id=challenge-123')
    );
  });

  it('should mark all as read when button is clicked', () => {
    const storeWithData = { ...defaultStore, notifications: mockNotifications, unreadCount: 1 };
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(storeWithData);
      return storeWithData;
    });
    (useNotificationStore as any).getState = () => storeWithData;

    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    const markAllBtn = screen.getByText('모두 읽음');
    fireEvent.click(markAllBtn);

    expect(storeWithData.markAllAsRead).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    const storeLoading = { ...defaultStore, loading: true };
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(storeLoading);
      return storeLoading;
    });
    (useNotificationStore as any).getState = () => storeLoading;

    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    expect(screen.getByText('알림을 불러오는 중...')).toBeInTheDocument();
  });

  it('should format time correctly for different intervals', () => {
    const now = Date.now();
    const times = [
      { date: new Date(now - 1000 * 30), expected: '방금 전' },
      { date: new Date(now - 1000 * 60 * 2), expected: '2분 전' },
      { date: new Date(now - 1000 * 60 * 60 * 3), expected: '3시간 전' },
      { date: new Date(now - 1000 * 60 * 60 * 24 * 4), expected: '4일 전' },
      {
        date: new Date(now - 1000 * 60 * 60 * 24 * 10),
        expected: new Date(now - 1000 * 60 * 60 * 24 * 10).toLocaleDateString('ko-KR'),
      },
    ];

    times.forEach(({ date, expected }) => {
      const notification = {
        ...mockNotifications[0],
        timestamp: date,
        id: `test-${date.getTime()}`,
      };
      const storeWithData = { ...defaultStore, notifications: [notification] };
      (useNotificationStore as any).mockImplementation((selector?: any) => {
        if (selector) return selector(storeWithData);
        return storeWithData;
      });
      (useNotificationStore as any).getState = () => storeWithData;

      const { unmount } = render(
        <BrowserRouter>
          <NotificationPage />
        </BrowserRouter>
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('should not call markAsRead if notification is already read', () => {
    const readNotification = { ...mockNotifications[1], read: true };
    const storeWithData = { ...defaultStore, notifications: [readNotification] };
    (useNotificationStore as any).mockImplementation((selector?: any) => {
      if (selector) return selector(storeWithData);
      return storeWithData;
    });
    (useNotificationStore as any).getState = () => storeWithData;

    render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    const item = screen.getByTestId(`notification-item-${readNotification.id}`);
    fireEvent.click(item);

    expect(storeWithData.markAsRead).not.toHaveBeenCalled();
  });
});
