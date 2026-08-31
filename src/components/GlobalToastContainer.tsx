import { useToastStore } from '../stores/useToastStore';
import { Toast } from './Toast';

export function GlobalToastContainer() {
  const message = useToastStore((state) => state.message);
  const isOpen = useToastStore((state) => state.isOpen);
  const icon = useToastStore((state) => state.icon);
  const duration = useToastStore((state) => state.duration);
  const hideToast = useToastStore((state) => state.hideToast);

  return (
    <Toast
      message={message}
      isOpen={isOpen}
      icon={icon}
      autoCloseDelay={duration}
      onClose={hideToast}
    />
  );
}
