import { create } from 'zustand';
import { StatusType } from '../constants/status';

interface ToastState {
  message: string;
  isOpen: boolean;
  icon?: StatusType;
  duration: number;
  showToast: (message: string, icon?: StatusType, duration?: number) => void;
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
