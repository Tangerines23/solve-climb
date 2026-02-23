import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, useProfileStore } from '../stores/useProfileStore';
import { sanitizeNickname, validateNickname } from '../utils/validation';
import './ProfileForm.css';

interface ProfileFormProps {
  onComplete: () => void;
  showBackButton?: boolean;
  onCancel?: () => void;
}

export function ProfileForm({ onComplete, showBackButton = false, onCancel }: ProfileFormProps) {
  const navigate = useNavigate();
  // Zustand Selector 패턴 적용
  const setProfile = useProfileStore((state) => state.setProfile);
  const profile = useProfileStore((state) => state.profile);
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [error, setError] = useState('');
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // const [googleUser, setGoogleUser] = useState<{ email: string; name: string; picture: string } | null>(null);

  // 구글 로그인 기능 주석처리
  // const handleGoogleLogin = async () => {
  //   try {
  //     setIsGoogleLoading(true);
  //     setError('');
  //
  //     const user = await openGoogleLogin();
  //
  //     // 어드민 이메일 확인
  //     const isAdmin = isAdminEmail(user.email);
  //
  //     if (!isAdmin) {
  //       setError('어드민 계정만 구글 로그인을 사용할 수 있습니다.');
  //       setIsGoogleLoading(false);
  //       return;
  //     }
  //
  //     setGoogleUser({
  //       email: user.email,
  //       name: user.name,
  //       picture: user.picture,
  //     });
  //
  //     // 닉네임 자동 설정
  //     setNickname(user.name || user.email.split('@')[0]);
  //     setIsGoogleLoading(false);
  //   } catch (error) {
  //     console.error('Google login error:', error);
  //     const errorMessage = error instanceof Error ? error.message : '구글 로그인에 실패했습니다.';
  //
  //     // Google Client ID 미설정 에러인 경우 더 자세한 안내 제공
  //     if (errorMessage.includes('Google Client ID가 설정되지 않았습니다')) {
  //       setError(
  //         '구글 로그인 설정이 필요합니다.\n\n' +
  //         '1. frontend 폴더에 .env 파일 생성\n' +
  //         '2. VITE_GOOGLE_CLIENT_ID=your-client-id 추가\n' +
  //         '3. 개발 서버 재시작\n\n' +
  //         '자세한 내용은 .env.example 파일을 참고하세요.'
  //       );
  //     } else {
  //       setError(errorMessage);
  //     }
  //     setIsGoogleLoading(false);
  //   }
  // };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 닉네임 정제 (HTML 태그 제거, 공백 정규화)
    const sanitizedNickname = sanitizeNickname(nickname);

    // 닉네임 검증
    const validation = validateNickname(sanitizedNickname);
    if (!validation.valid) {
      setError(validation.error || '닉네임이 올바르지 않습니다.');
      return;
    }

    // 닉네임으로는 관리자 권한 부여 안 함
    // 관리자 권한은 키보드 입력으로만 가능 (출시 전 확인 필요)
    const isAdmin = false;

    const existingProfile = profile;
    const profileData: UserProfile = {
      profileId: existingProfile?.profileId || '', // 기존 프로필이 있으면 ID 유지, 없으면 빈 문자열 (스토어에서 생성)
      nickname: sanitizedNickname,
      // email: googleUser?.email,
      // avatar: googleUser?.picture,
      // userId: googleUser?.email,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      isAdmin: isAdmin,
    };

    setProfile(profileData);

    // [New] Supabase 프로필 닉네임 동기화 (비동기 처리)
    import('../utils/supabaseClient').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // RPC 함수 호출하여 닉네임 업데이트
          supabase
            .rpc('update_profile_nickname', { p_nickname: sanitizedNickname })
            .then(({ error }) => {
              if (error) console.error('Failed to sync nickname to Supabase:', error);
              else console.log('Nickname synced to Supabase');
            });
        }
      });
    });

    onComplete();
  };

  return (
    <div className="profile-form-container">
      {showBackButton && (
        <button
          className="btn-icon profile-form-back-button"
          onClick={() => (onCancel ? onCancel() : navigate(-1))}
        >
          ←
        </button>
      )}
      <h2 className="profile-form-title">{profile ? '프로필 수정' : '프로필 만들기'}</h2>
      <p className="profile-form-description">
        {profile
          ? '프로필 정보를 수정할 수 있습니다.'
          : '게임을 시작하기 전에 프로필을 만들어주세요.\n한 번만 설정하면 됩니다!'}
      </p>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-form-field">
          <label htmlFor="nickname" className="profile-form-label">
            닉네임
          </label>
          <input
            id="nickname"
            type="text"
            inputMode="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            placeholder="닉네임을 입력하세요"
            className={`input-base profile-form-input ${error ? 'error' : ''}`}
            maxLength={10}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {error && <p className="profile-form-error">{error}</p>}
          <p className="profile-form-hint">{nickname.length}/10자</p>
        </div>

        {/* 구글 로그인 기능 주석처리 */}
        {/* {nickname.toLowerCase().trim() === 'admin' && !googleUser && (
          <div className="profile-form-field">
            <p className="profile-form-admin-notice">
              어드민 계정은 구글 로그인이 필요합니다.
            </p>
            <button
              type="button"
              className="profile-form-google-button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>로딩 중...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 'var(--spacing-sm)' }}>
                    <path
                      fill="var(--color-blue-500)"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    />
                    <path
                      fill="var(--color-green-500)"
                      d="M9 18c2.43 0 4.467-.806 5.965-2.184l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    />
                    <path
                      fill="var(--color-yellow-400)"
                      d="M3.947 10.698c-.18-.54-.282-1.117-.282-1.698 0-.581.102-1.158.282-1.698V4.97H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.03l2.99-2.332z"
                    />
                    <path
                      fill="var(--color-red-500)"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.97L3.947 7.302C4.66 5.167 6.65 3.58 9 3.58z"
                    />
                  </svg>
                  구글로 로그인
                </>
              )}
            </button>
          </div>
        )}

        {googleUser && (
          <div className="profile-form-google-user">
            <img src={googleUser.picture} alt={googleUser.name} className="profile-form-google-avatar" />
            <div className="profile-form-google-info">
              <p className="profile-form-google-name">{googleUser.name}</p>
              <p className="profile-form-google-email">{googleUser.email}</p>
            </div>
          </div>
        )} */}

        <button type="submit" className="btn-base btn-primary profile-form-submit">
          {profile ? '저장하기' : '시작하기'}
        </button>
      </form>
    </div>
  );
}
