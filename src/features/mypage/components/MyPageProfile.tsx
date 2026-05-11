import { Tier } from '@/features/auth/domain/Tier';
import { Email } from '@/features/auth/domain/Email';

interface MyPageProfileProps {
  nickname: string;
  email: Email;
  totalMasteryScore: number;
  loginStreak?: number;
  tier: Tier;
  loading: boolean;
  onEditProfile: () => void;
}

export function MyPageProfile({
  nickname,
  email,
  totalMasteryScore,
  loginStreak = 0,
  tier,
  loading,
  onEditProfile,
}: MyPageProfileProps) {
  return (
    <div className="my-page-header">
      <div className="my-page-profile-section">
        <div className="my-page-profile-icon" style={{ borderColor: `var(${tier.colorVar})` }}>
          {tier.icon}
        </div>
        <div className="my-page-profile-info">
          <div className="my-page-nickname-row">
            <div className="my-page-nickname-container">
              <h2 className="my-page-nickname">{nickname}</h2>
              <p className="my-page-email">{email.getMasked()}</p>
            </div>
            <div
              className="my-page-tier-badge"
              style={{ backgroundColor: `var(${tier.colorVar})` }}
            >
              {tier.getDisplayName()}
            </div>
            {loginStreak > 0 && (
              <div className="my-page-streak-badge">
                <span className="streak-icon">🔥</span>
                <span className="streak-count">{loginStreak}일째</span>
              </div>
            )}
          </div>
          <button className="my-page-profile-edit-button" onClick={onEditProfile}>
            프로필 수정
          </button>
        </div>
      </div>
      <div className="my-page-mastery-section">
        <div className="my-page-mastery-label">누적 고도</div>
        <div className="my-page-mastery-value">
          {loading ? '...' : (totalMasteryScore || 0).toLocaleString()}m
        </div>
      </div>
    </div>
  );
}
