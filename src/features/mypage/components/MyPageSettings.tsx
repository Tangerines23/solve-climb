import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { urls } from '@/utils/navigation';
import { useToastStore } from '@/stores/useToastStore';
import { BaseModal } from '@/components/BaseModal';
import { ENV } from '@/utils/env';

interface MyPageSettingsProps {
  hapticEnabled: boolean;
  animationEnabled: boolean;
  onToggleHaptic: () => void;
  onToggleAnimation: () => void;
  onShowProfileForm: () => void;
  onDataReset: () => void;
  isResetting: boolean;
  onSendFeedback: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
}

export function MyPageSettings({
  hapticEnabled,
  animationEnabled,
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
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
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
        if (serverVersion === APP_CONFIG.APP_VERSION) {
          showToast(`현재 최신 버전을 사용 중입니다. (${APP_CONFIG.APP_VERSION})`, '✅', 2500);
        } else {
          setLatestVersion(serverVersion);
          setShowUpdateModal(true);
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

  const handleGoToUpdate = () => {
    setShowUpdateModal(false);
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.solveclimb.app';
    window.open(playStoreUrl, '_blank');
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
      {showUpdateModal && latestVersion && (
        <BaseModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title="새로운 버전 출시"
          actions={
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                justifyContent: 'flex-end',
                width: '100%',
              }}
            >
              <button
                className="btn-base btn-secondary"
                onClick={() => setShowUpdateModal(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderRadius: 'var(--rounded-xs)',
                  fontSize: '14px',
                }}
              >
                나중에
              </button>
              <button
                className="btn-base btn-primary"
                onClick={handleGoToUpdate}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderRadius: 'var(--rounded-xs)',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-teal-500)',
                  color: 'white',
                  border: 'none',
                }}
              >
                업데이트
              </button>
            </div>
          }
        >
          <div
            style={{
              padding: 'var(--spacing-xs) 0',
              color: 'var(--color-gray-700)',
              fontSize: '15px',
              lineHeight: '1.6',
            }}
          >
            <p>
              새로운 버전 <strong>v{latestVersion}</strong>이 준비되었습니다.
            </p>
            <p
              style={{
                marginTop: 'var(--spacing-tiny)',
                fontSize: '13px',
                color: 'var(--color-gray-500)',
              }}
            >
              현재 버전: v{APP_CONFIG.APP_VERSION}
            </p>
            <p style={{ marginTop: 'var(--spacing-md)' }}>지금 업데이트를 진행하시겠습니까?</p>
          </div>
        </BaseModal>
      )}
    </div>
  );
}
