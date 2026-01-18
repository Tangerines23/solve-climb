import { create } from 'zustand';

interface ToastState {
  message: string;
  isOpen: boolean;
  icon?: string;
  duration: number;
  showToast: (message: string, icon?: string, duration?: number) => void;
  hideToast: () => void;
}

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
