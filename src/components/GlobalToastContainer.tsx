import { useToastStore } from '../stores/useToastStore';
import { Toast } from './Toast';

export function GlobalToastContainer() {
  const { message, isOpen, icon, duration, hideToast } = useToastStore();

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
