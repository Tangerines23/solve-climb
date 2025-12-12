// Supabase 인증 콜백 처리 페이지
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase가 URL에서 세션을 자동으로 감지하고 처리합니다
        // detectSessionInUrl: true 옵션이 설정되어 있으므로 자동 처리됨
        
        // 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('인증 콜백 처리 중 오류:', error);
          navigate('/my-page');
          return;
        }

        if (session) {
          // 인증 성공 - 마이페이지로 리디렉션
          navigate('/my-page');
        } else {
          // 세션이 없으면 마이페이지로 이동 (로그인 페이지 표시)
          navigate('/my-page');
        }
      } catch (error) {
        console.error('인증 콜백 처리 중 예외:', error);
        navigate('/my-page');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // 로딩 화면 표시
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
    }}>
      <div>로그인 처리 중...</div>
    </div>
  );
}

