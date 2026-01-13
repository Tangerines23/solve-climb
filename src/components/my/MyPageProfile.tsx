interface MyPageProfileProps {
  nickname: string;
  totalMasteryScore: number;
  currentTierLevel?: number;
  loading: boolean;
  onEditProfile: () => void;
}

export function MyPageProfile({
  nickname,
  totalMasteryScore,
  loading,
  onEditProfile,
}: MyPageProfileProps) {
  return (
    <div className="my-page-header">
      <div className="my-page-profile-section">
        <div className="my-page-profile-icon">🧗</div>
        <div className="my-page-profile-info">
          <h2 className="my-page-nickname">{nickname}</h2>
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
