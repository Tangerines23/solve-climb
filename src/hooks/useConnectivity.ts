import { useEffect, useState } from 'react';
import { useToastStore } from '@/stores/useToastStore';

/**
 * 네트워크 연결 상태를 감시하는 훅
 * 오프라인 상태가 되면 사용자에게 알림을 표시합니다.
 */
export function useConnectivity() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { showToast } = useToastStore();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showToast('네트워크 연결이 복구되었습니다. 📶', 'success');
        };

        const handleOffline = () => {
            setIsOnline(false);
            showToast('네트워크 연결이 끊겼습니다. 오프라인 모드로 동작합니다. ⚠️', 'warn');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showToast]);

    return isOnline;
}
