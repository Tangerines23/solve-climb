import { create } from 'zustand';

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

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: true,
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
  addNotification: (notification) =>
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.read).length,
      };
    }),
  markAsRead: (id) =>
    set((state) => {
      const newNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.read).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => {
      const newNotifications = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: newNotifications,
        unreadCount: 0,
      };
    }),
  setLoading: (loading) => set({ loading }),
}));
