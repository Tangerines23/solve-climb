import { useGlobalToast } from '../hooks/useGlobalToast';
import { Toast } from './Toast';

export function GlobalToastContainer() {
  const { message, isOpen, icon, duration, hideToast } = useGlobalToast();

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
