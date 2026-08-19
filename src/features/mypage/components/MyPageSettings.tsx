import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { urls } from '@/utils/navigation';
import { useToastStore } from '@/stores/useToastStore';
import { Toast } from '@/components/Toast';
import { ENV } from '@/utils/env';
import { isNativeAppPlatform } from '@/utils/auth';

interface MyPageSettingsProps {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  hapticEnabled: boolean;
  animationEnabled: boolean;
  onToggleSound: () => void;
  onToggleBgm: () => void;
  onToggleHaptic: () => void;
  onToggleAnimation: () => void;
  onShowProfileForm: () => void;
  onDataReset: () => void;
  isResetting: boolean;
  onSendFeedback: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
}
const isVersionOlder = (current: string, server: string): boolean => {
  const cParts = current.split('.').map(Number);
  const sParts = server.split('.').map(Number);

  for (let i = 0; i < Math.max(cParts.length, sParts.length); i++) {
    const cVal = cParts[i] || 0;
    const sVal = sParts[i] || 0;
    if (cVal < sVal) return true;
    if (cVal > sVal) return false;
  }
  return false;
};
export function MyPageSettings({
  soundEnabled,
  bgmEnabled,
  hapticEnabled,
  animationEnabled,
  onToggleSound,
  onToggleBgm,
  onToggleHaptic,
  onToggleAnimation,
  onShowProfileForm,
  onDataReset,
  isResetting,
  onSendFeedback,
  onLogout,
  onWithdraw,
}: MyPageSettingsProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [showLocalToast, setShowLocalToast] = useState(false);
  const [localToastMsg, setLocalToastMsg] = useState('');
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const handleCheckUpdate = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isChecking) return;
    setIsChecking(true);
    showToast('최신 버전을 확인하고 있습니다...', '🔄', 1500);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const siteUrl = ENV.VITE_SITE_URL || 'https://solve-climb.vercel.app/';
      const targetUrl = `${siteUrl.replace(/\/$/, '')}/version.json`;

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Version fetch failed');
      }

      const data = await response.json();
      const serverVersion = data.version;

      if (serverVersion) {
        if (isVersionOlder(APP_CONFIG.APP_VERSION, serverVersion)) {
          if (isNativeAppPlatform()) {
            setLocalToastMsg(`새로운 버전\nv${serverVersion}이\n준비되었습니다.`);
            setHasNewVersion(true);
            setShowLocalToast(true);
          } else {
            showToast(`새로운 웹 빌드 v${serverVersion}가 있습니다. 새로고침합니다.`, '🔄', 2000);
            setTimeout(async () => {
              if (typeof window !== 'undefined') {
                try {
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                      await reg.update().catch(() => {});
                      await reg.unregister().catch(() => {});
                    }
                  }
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                  }
                } catch (_e) {
                  // ignore
                }
                window.location.reload();
              }
            }, 1000);
          }
        } else {
          showToast(`현재 최신 버전을 사용 중입니다. (${APP_CONFIG.APP_VERSION})`, '✅', 2500);
        }
      } else {
        throw new Error('Invalid version format');
      }
    } catch (err) {
      console.error('[UpdateCheck] Failed to check for update:', err);
      showToast('버전 정보를 가져오지 못했습니다. 네트워크를 확인해주세요.', '❌', 2500);
    } finally {
      setIsChecking(false);
    }
  };

  const handleGoToUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLocalToast(false);

    // Play Store 앱 상세 페이지 주소
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.solveclimb.app';
    const playStoreMarketUrl = 'market://details?id=com.solveclimb.app';

    if (isNativeAppPlatform()) {
      try {
        // market:// 스키마를 통해 플레이스토어 앱이 직접 켜지도록 유도, 불가능할 경우 웹 브라우저로 백업
        window.open(playStoreMarketUrl, '_system');
      } catch (_err) {
        window.open(playStoreUrl, '_system');
      }
    } else {
      window.open(playStoreUrl, '_blank');
    }
  };

  return (
    <div className="my-page-settings">
      {/* 환경 설정 섹션 */}
      <div className="my-page-settings-section">
        <h2 className="my-page-settings-section-title">환경 설정</h2>
        <div className="my-page-settings-list">
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={onShowProfileForm}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">프로필 수정</span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            className="my-page-settings-item my-page-settings-item-clickable"
            onClick={onToggleSound}
            data-vg-ignore="true"
            role="button"
            aria-pressed={soundEnabled}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleSound();
              }
            }}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">효과음</span>
            </div>
            <div className="my-page-settings-toggle-wrapper">
              <div className="my-page-settings-toggle">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  readOnly
                  aria-label="효과음 설정 제어"
                  tabIndex={-1}
                />
                <span className="my-page-settings-toggle-slider"></span>
              </div>
            </div>
          </div>
          <div
            className="my-page-settings-item my-page-settings-item-clickable"
            onClick={onToggleBgm}
            data-vg-ignore="true"
            role="button"
            aria-pressed={bgmEnabled}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleBgm();
              }
            }}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">배경음악 (BGM)</span>
            </div>
            <div className="my-page-settings-toggle-wrapper">
              <div className="my-page-settings-toggle">
                <input
                  type="checkbox"
                  checked={bgmEnabled}
                  readOnly
                  aria-label="배경음악 설정 제어"
                  tabIndex={-1}
                />
                <span className="my-page-settings-toggle-slider"></span>
              </div>
            </div>
          </div>
          <div
            className="my-page-settings-item my-page-settings-item-clickable"
            onClick={onToggleHaptic}
            data-vg-ignore="true"
            role="button"
            aria-pressed={hapticEnabled}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleHaptic();
              }
            }}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">진동</span>
            </div>
            <div className="my-page-settings-toggle-wrapper">
              <div className="my-page-settings-toggle">
                <input
                  type="checkbox"
                  checked={hapticEnabled}
                  readOnly
                  aria-label="진동 설정 제어"
                  tabIndex={-1}
                />
                <span className="my-page-settings-toggle-slider"></span>
              </div>
            </div>
          </div>
          <div
            className="my-page-settings-item my-page-settings-item-clickable"
            onClick={onToggleAnimation}
            data-vg-ignore="true"
            role="button"
            aria-pressed={!animationEnabled}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleAnimation();
              }
            }}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">정적 UI 모드</span>
            </div>
            <div className="my-page-settings-toggle-wrapper">
              <div className="my-page-settings-toggle">
                <input
                  type="checkbox"
                  checked={!animationEnabled}
                  readOnly
                  aria-label="정적 UI 모드 설정 제어"
                  tabIndex={-1}
                />
                <span className="my-page-settings-toggle-slider"></span>
              </div>
            </div>
          </div>
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={() =>
              navigate(
                urls.quiz({
                  mountain: 'math',
                  world: 'World1',
                  category: 'arithmetic',
                  level: 1,
                  mode: 'time-attack',
                  preview: true,
                })
              )
            }
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">키보드 미리보기</span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={() => navigate(urls.review())}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">예습 복습</span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 데이터 관리 섹션 */}
      <div className="my-page-settings-section">
        <h2 className="my-page-settings-section-title">데이터</h2>
        <div className="my-page-settings-list">
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={onDataReset}
            disabled={isResetting}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">초기화</span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={onWithdraw}
            style={{ color: 'var(--color-toss-red-a11y)' }} // Higher contrast for a11y
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label" style={{ color: 'inherit' }}>
                탈퇴하기
              </span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'inherit' }}
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 앱 정보 섹션 */}
      <div className="my-page-settings-section">
        <h2 className="my-page-settings-section-title">앱 정보</h2>
        <div className="my-page-settings-list">
          <div className="my-page-settings-item">
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">버전</span>
            </div>
            <span
              className="my-page-settings-item-value"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-tiny)' }}
            >
              {APP_CONFIG.APP_VERSION}
              <button
                onClick={handleCheckUpdate}
                disabled={isChecking}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 'var(--spacing-xs)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--color-teal-500)',
                  borderRadius: '50%',
                  transformOrigin: 'center',
                  animation: isChecking ? 'spin 1s linear infinite' : 'none',
                }}
                aria-label="업데이트 확인"
                title="업데이트 확인"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>

              {isNativeAppPlatform() && (
                <button
                  onClick={handleGoToUpdate}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: 'var(--spacing-micro) var(--spacing-xs)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-micro)',
                    color: 'var(--color-text-secondary)',
                    borderRadius: 'var(--rounded-2xs)',
                    fontSize: '0.75rem',
                    marginLeft: 'var(--spacing-micro)',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label="플레이스토어 이동"
                  title="플레이스토어 앱 이동"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  스토어 이동
                </button>
              )}
            </span>
          </div>
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={onSendFeedback}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">의견 보내기</span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="my-page-settings-item my-page-settings-item-button"
            onClick={() => navigate(urls.privacyPolicy())}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">개인정보처리방침</span>
            </div>
            <svg
              className="my-page-settings-item-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 로그아웃 섹션 */}
      <div className="my-page-settings-section">
        <div className="my-page-settings-list">
          <button
            className="my-page-settings-item my-page-settings-item-button my-page-settings-item-logout"
            onClick={onLogout}
          >
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label my-page-settings-item-logout-label">
                로그아웃
              </span>
            </div>
          </button>
        </div>
      </div>
      {showLocalToast && (
        <Toast
          message={localToastMsg}
          isOpen={showLocalToast}
          onClose={() => setShowLocalToast(false)}
          autoClose={true}
          autoCloseDelay={hasNewVersion ? 8000 : 3000}
          icon={hasNewVersion ? '🎁' : undefined}
        >
          {hasNewVersion && (
            <button
              onClick={handleGoToUpdate}
              style={{
                marginLeft: 'var(--spacing-md)',
                backgroundColor: 'transparent',
                color: 'var(--color-pure-white)',
                border: 'none',
                padding: 'var(--spacing-xs) 0',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              업데이트
            </button>
          )}
        </Toast>
      )}
    </div>
  );
}
