// Supabase 인증 콜백 처리 페이지
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

/**
 * 토스 앱 인앱 환경 확인
 */
const isTossEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator?.userAgent || '';
  return userAgent.includes('Toss') || !!(window as any).ReactNativeWebView;
};

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-session'>('loading');
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL 파라미터 확인 (Supabase 인증 후 리디렉션인지 확인)
        const hasAuthParams = searchParams.has('code') || 
                             searchParams.has('access_token') || 
                             searchParams.has('error') ||
                             searchParams.has('error_description');
        
        // 토스 앱 환경에서 에러 파라미터 확인
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          console.error('인증 오류:', errorParam, errorDescription);
          setStatus('error');
          setMessage(`인증 오류: ${errorDescription || errorParam}`);
          
          // 토스 앱 환경에서는 에러를 더 명확하게 표시
          if (isTossEnvironment()) {
            setTimeout(() => {
              navigate('/my-page');
            }, 3000);
          } else {
            setTimeout(() => {
              navigate('/my-page');
            }, 3000);
          }
          return;
        }

        if (!hasAuthParams) {
          // 인증 파라미터가 없으면 직접 접근한 것으로 간주
          setStatus('no-session');
          setMessage('인증 정보가 없습니다. 로그인 페이지로 이동합니다.');
          setTimeout(() => {
            navigate('/my-page');
          }, 2000);
          return;
        }

        // Supabase가 URL에서 세션을 자동으로 감지하고 처리합니다
        // detectSessionInUrl: true 옵션이 설정되어 있으므로 자동 처리됨
        
        // 토스 앱 환경에서는 추가 대기 시간 필요할 수 있음
        if (isTossEnvironment()) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('인증 콜백 처리 중 오류:', error);
          setStatus('error');
          setMessage(`세션 확인 오류: ${error.message}`);
          
          // 토스 앱 환경에서의 특별 처리
          if (isTossEnvironment()) {
            console.warn('[Toss] 인증 콜백 처리 실패 - 토스 앱 환경에서 Supabase 인증이 제한될 수 있습니다.');
          }
          
          setTimeout(() => {
            navigate('/my-page');
          }, 3000);
          return;
        }

        if (session) {
          // 인증 성공
          setStatus('success');
          setMessage('로그인 성공! 마이페이지로 이동합니다.');
          setTimeout(() => {
            navigate('/my-page');
          }, 1500);
        } else {
          // 세션이 없으면 마이페이지로 이동 (로그인 페이지 표시)
          setStatus('no-session');
          setMessage('세션을 찾을 수 없습니다. 로그인 페이지로 이동합니다.');
          setTimeout(() => {
            navigate('/my-page');
          }, 2000);
        }
      } catch (error) {
        console.error('인증 콜백 처리 중 예외:', error);
        setStatus('error');
        setMessage(`예상치 못한 오류: ${error instanceof Error ? error.message : String(error)}`);
        
        // 토스 앱 환경에서의 에러 로깅
        if (isTossEnvironment()) {
          console.error('[Toss] 인증 콜백 예외:', error);
        }
        
        setTimeout(() => {
          navigate('/my-page');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  // 상태에 따른 메시지 표시
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'no-session':
        return 'ℹ️';
      default:
        return '⏳';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      padding: 'var(--spacing-xl)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-lg)' }}>
        {getStatusIcon()}
      </div>
      <div style={{ fontSize: '18px', marginBottom: 'var(--spacing-md)' }}>
        {message}
      </div>
      {status === 'loading' && (
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-md)' }}>
          잠시만 기다려주세요...
        </div>
      )}
      {status === 'error' && isTossEnvironment() && (
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--color-text-secondary)', 
          marginTop: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: 'var(--rounded-sm)',
          maxWidth: '400px',
        }}>
          <p>토스 앱 인앱 환경에서는 Supabase OAuth 인증이 제한될 수 있습니다.</p>
          <p style={{ marginTop: 'var(--spacing-sm)' }}>익명 로그인을 사용해주세요.</p>
        </div>
      )}
    </div>
  );
}

