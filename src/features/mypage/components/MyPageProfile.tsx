interface MyPageProfileProps {
  nickname: string;
  email?: string | null;
  isAnonymous?: boolean;
  totalMasteryScore: number;
  loginStreak?: number;
  currentTierLevel?: number;
  loading: boolean;
  onEditProfile: () => void;
}

export function MyPageProfile({
  nickname,
  email,
  isAnonymous,
  totalMasteryScore,
  loginStreak = 0,
  loading,
  onEditProfile,
}: MyPageProfileProps) {
  const accountLabel = isAnonymous ? '익명 계정' : email || '구글 계정';

  return (
    <div className="my-page-header">
      <div className="my-page-profile-section">
        <div className="my-page-profile-icon">🧗</div>
        <div className="my-page-profile-info">
          <div className="my-page-nickname-row">
            <h2 className="my-page-nickname">{nickname}</h2>
            {loginStreak > 0 && (
              <div className="my-page-streak-badge">
                <span className="streak-icon">🔥</span>
                <span className="streak-count">{loginStreak}일째</span>
              </div>
            )}
          </div>
          <div className="my-page-account-badge">
            <span className="account-icon">{isAnonymous ? '👤' : '📧'}</span>
            <span className="account-email">{accountLabel}</span>
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
