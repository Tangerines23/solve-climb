import { create } from 'zustand';

interface ToastState {
  message: string;
  isOpen: boolean;
  icon?: string;
  duration: number;
  showToast: (message: string, icon?: string, duration?: number) => void;
  hideToast: () => void;
}

/**
 * [Toast Store]
 * 전역 토스트 알림 메시지 큐 및 팝업 상태를 관리합니다.
 */
export const useToastStore = create<ToastState>((set) => ({
  message: '',
  isOpen: false,
  icon: undefined,
  duration: 2000,
  showToast: (message, icon, duration = 2000) => {
    set({ message, icon, duration, isOpen: true });
  },
  hideToast: () => {
    set({ isOpen: false });
  },
}));
