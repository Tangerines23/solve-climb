import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app';
import { urls } from '../../utils/navigation';

interface MyPageSettingsProps {
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  onShowProfileForm: () => void;
  onDataReset: () => void;
  isResetting: boolean;
  onSendFeedback: () => void;
  onLogout: () => void;
}

export function MyPageSettings({
  hapticEnabled,
  onToggleHaptic,
  onShowProfileForm,
  onDataReset,
  isResetting,
  onSendFeedback,
  onLogout,
}: MyPageSettingsProps) {
  const navigate = useNavigate();

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
          <div className="my-page-settings-item">
            <div className="my-page-settings-item-content">
              <span className="my-page-settings-item-label">진동</span>
            </div>
            <label className="my-page-settings-toggle">
              <input type="checkbox" checked={hapticEnabled} onChange={onToggleHaptic} />
              <span className="my-page-settings-toggle-slider"></span>
            </label>
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
            <span className="my-page-settings-item-value">{APP_CONFIG.APP_VERSION}</span>
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
    </div>
  );
}
