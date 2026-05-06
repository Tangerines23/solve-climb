import { useToastStore } from '../stores/useToastStore';

export function useGlobalToast() {
  const { message, isOpen, icon, duration, hideToast } = useToastStore();

  return {
    message,
    isOpen,
    icon,
    duration,
    hideToast,
  };
}
