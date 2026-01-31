import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toast } from './Toast';
import { useEffect, useState } from 'react';

export function PwaUpdateNotification() {
  const swRegistration = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error: unknown) {
      console.error('SW registration error:', error);
    },
  });

  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  // optional chaining: E2E/테스트에서 vite-plugin-pwa 미로드 시 undefined 반환
  const offlineReady = swRegistration?.offlineReady?.[0] ?? false;
  const setOfflineReady = swRegistration?.offlineReady?.[1];
  const needUpdate = swRegistration?.needRefresh?.[0] ?? false;
  const setNeedUpdate = swRegistration?.needRefresh?.[1];
  const updateServiceWorker = swRegistration?.updateServiceWorker;

  useEffect(() => {
    if (offlineReady) {
      setMessage('준비 완료! 이제 오프라인에서도 즐기실 수 있습니다.');
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needUpdate) {
      setMessage('새 버전이 준비되었습니다. 지금 업데이트할까요?');
      setShow(true);
    }
  }, [needUpdate]);

  const handleClose = () => {
    setShow(false);
    if (offlineReady) setOfflineReady?.(false);
    if (needUpdate) setNeedUpdate?.(false);
  };

  const handleConfirm = () => {
    updateServiceWorker?.(true);
    setShow(false);
  };

  // E2E/테스트에서 vite-plugin-pwa 미로드 시 null 렌더 (optional chaining으로 destructuring은 안전)
  if (!swRegistration) return null;
  if (!show) return null;

  return (
    <Toast
      message={message}
      isOpen={show}
      onClose={handleClose}
      autoClose={offlineReady} // 오프라인 준비 완료일 때만 자동 닫기
      autoCloseDelay={3000}
    >
      {needUpdate && (
        <button
          onClick={handleConfirm}
          style={{
            marginLeft: 'var(--spacing-md)',
            backgroundColor: 'var(--color-teal-500)',
            color: 'white',
            border: 'none',
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--rounded-2xs)',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          업데이트
        </button>
      )}
    </Toast>
  );
}
