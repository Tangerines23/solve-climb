import { logError } from '../utils/errorHandler';
import { useErrorLogStore } from '../stores/useErrorLogStore';
import { useToastStore } from '../stores/useToastStore';
import { useConnectivity } from './useConnectivity';

export function useErrorHandling() {
  const addLog = useErrorLogStore((state) => state.addLog);
  const showToast = useToastStore((state) => state.showToast);
  const isOnline = useConnectivity();

  const captureError = (componentName: string, error: Error, componentStack?: string) => {
    logError(componentName, error);
    
    if (import.meta.env.DEV) {
      addLog(
        'error',
        error.message,
        error.stack,
        `${componentName}: ${componentStack?.split('\n')[0] || 'Unknown component'}`
      );
    }
  };

  const copyErrorToClipboard = (error: Error, isChunkLoadError: boolean) => {
    const errorText = `[${isChunkLoadError ? 'CHUNK_ERROR' : 'APP_ERROR'}] ${error.message}\n\nURL: ${window.location.href}\nTime: ${new Date().toLocaleString()}\n\nStack:\n${error.stack || ''}`;
    
    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        showToast('에러 로그가 복사되었습니다!', '📋');
      })
      .catch((err) => {
        console.error('Failed to copy error:', err);
        prompt('Ctrl+C를 눌러 복사하세요:', errorText);
      });
  };

  return {
    captureError,
    copyErrorToClipboard,
    isOnline,
  };
}
