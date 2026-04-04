import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore, Notification } from '../useNotificationStore';
import { act } from '@testing-library/react';

describe('useNotificationStore', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'record_broken',
      title: '신기록 달성!',
      message: '축하합니다. 신기록을 경신했습니다.',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      type: 'challenge',
      title: '도전장 도착',
      message: '새로운 도전장이 도착했습니다.',
      timestamp: new Date(),
      read: true,
    },
  ];

  beforeEach(() => {
    act(() => {
      useNotificationStore.setState({
        notifications: [],
        loading: true,
        unreadCount: 0,
      });
    });
  });

  it('should initialize with default state', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('should set notifications and update unread count', () => {
    act(() => {
      useNotificationStore.getState().setNotifications(mockNotifications);
    });

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual(mockNotifications);
    expect(state.unreadCount).toBe(1); // Only '1' is unread
  });

  it('should add a notification and update unread count', () => {
    const newNotification: Notification = {
      id: '3',
      type: 'record_broken',
      title: '새로운 알림',
      message: '테스트 메시지',
      timestamp: new Date(),
      read: false,
    };

    act(() => {
      useNotificationStore.getState().addNotification(newNotification);
    });

    const state = useNotificationStore.getState();
    expect(state.notifications[0]).toEqual(newNotification);
    expect(state.unreadCount).toBe(1);
  });

  it('should mark a notification as read and update unread count', () => {
    act(() => {
      useNotificationStore.getState().setNotifications(mockNotifications);
    });

    act(() => {
      useNotificationStore.getState().markAsRead('1');
    });

    const state = useNotificationStore.getState();
    expect(state.notifications.find((n) => n.id === '1')?.read).toBe(true);
    expect(state.unreadCount).toBe(0); // All read now
  });

  it('should mark all notifications as read', () => {
    act(() => {
      useNotificationStore.getState().setNotifications(mockNotifications);
    });

    act(() => {
      useNotificationStore.getState().markAllAsRead();
    });

    const state = useNotificationStore.getState();
    expect(state.notifications.every((n) => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('should update loading state', () => {
    act(() => {
      useNotificationStore.getState().setLoading(false);
    });

    expect(useNotificationStore.getState().loading).toBe(false);
  });
});
