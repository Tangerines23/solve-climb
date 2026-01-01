// 인증 설정 테스트 페이지 (개발 환경용)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  testAuthSetup,
  testSupabaseConnection,
  testCallbackUrl,
  testGoogleLogin,
  getCallbackUrl,
} from '../utils/authTest';
import { ENV } from '../utils/env';
import type { AuthTestResult } from '../utils/authTest';
import './AuthTestPage.css';

export function AuthTestPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<{
    callbackUrl?: AuthTestResult;
    connection?: AuthTestResult;
    googleLogin?: AuthTestResult;
    summary?: {
      allPassed: boolean;
      passed: number;
      total: number;
    };
  }>({});
  const [loading, setLoading] = useState(false);
  const [callbackUrl] = useState(getCallbackUrl());

  const runAllTests = async () => {
    setLoading(true);
    try {
      const testResults = await testAuthSetup();
      setResults(testResults);
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await testSupabaseConnection();
      setResults((prev) => ({ ...prev, connection: result }));
    } catch (error) {
      console.error('연결 테스트 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCallback = () => {
    const result = testCallbackUrl();
    setResults((prev) => ({ ...prev, callbackUrl: result }));
  };

  const testGoogle = async () => {
    setLoading(true);
    try {
      const result = await testGoogleLogin();
      setResults((prev) => ({ ...prev, googleLogin: result }));

      // 성공하면 실제로 OAuth 리디렉션이 시작됨
      if (result.success && result.details?.url) {
        window.location.href = result.details.url;
      }
    } catch (error) {
      console.error('Google 로그인 테스트 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-test-page">
      <div className="auth-test-header">
        <h1>🔐 인증 설정 테스트</h1>
        <button className="auth-test-back-button" onClick={() => navigate('/my-page')}>
          ← 뒤로가기
        </button>
      </div>

      <div className="auth-test-content">
        {/* 환경 정보 */}
        <div className="auth-test-section">
          <h2>환경 정보</h2>
          <div className="auth-test-info">
            <div className="auth-test-info-item">
              <span className="auth-test-label">Supabase URL:</span>
              <span className="auth-test-value">{ENV.SUPABASE_URL || '미설정'}</span>
            </div>
            <div className="auth-test-info-item">
              <span className="auth-test-label">Anon Key:</span>
              <span className="auth-test-value">{ENV.SUPABASE_ANON_KEY ? '설정됨' : '미설정'}</span>
            </div>
            <div className="auth-test-info-item">
              <span className="auth-test-label">콜백 URL:</span>
              <span className="auth-test-value">{callbackUrl}</span>
            </div>
            <div className="auth-test-info-item">
              <span className="auth-test-label">현재 URL:</span>
              <span className="auth-test-value">{window.location.href}</span>
            </div>
          </div>
        </div>

        {/* 테스트 버튼 */}
        <div className="auth-test-section">
          <h2>테스트 실행</h2>
          <div className="auth-test-buttons">
            <button
              className="auth-test-button auth-test-button-primary"
              onClick={runAllTests}
              disabled={loading}
            >
              {loading ? '테스트 중...' : '전체 테스트 실행'}
            </button>
            <button className="auth-test-button" onClick={testConnection} disabled={loading}>
              Supabase 연결 테스트
            </button>
            <button className="auth-test-button" onClick={testCallback} disabled={loading}>
              콜백 URL 확인
            </button>
            <button className="auth-test-button" onClick={testGoogle} disabled={loading}>
              Google 로그인 테스트
            </button>
          </div>
        </div>

        {/* 테스트 결과 */}
        {(results.callbackUrl || results.connection || results.googleLogin) && (
          <div className="auth-test-section">
            <h2>테스트 결과</h2>

            {results.summary && (
              <div
                className={`auth-test-summary ${results.summary.allPassed ? 'success' : 'error'}`}
              >
                <div className="auth-test-summary-title">
                  {results.summary.allPassed ? '✅ 모든 테스트 통과' : '❌ 일부 테스트 실패'}
                </div>
                <div className="auth-test-summary-stats">
                  {results.summary.passed} / {results.summary.total} 통과
                </div>
              </div>
            )}

            {results.callbackUrl && (
              <div
                className={`auth-test-result ${results.callbackUrl.success ? 'success' : 'error'}`}
              >
                <h3>콜백 URL 확인</h3>
                <div className="auth-test-result-message">
                  {results.callbackUrl.success ? '✅' : '❌'} {results.callbackUrl.message}
                </div>
                {results.callbackUrl.details && (
                  <details className="auth-test-result-details">
                    <summary>상세 정보</summary>
                    <pre>{JSON.stringify(results.callbackUrl.details, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}

            {results.connection && (
              <div
                className={`auth-test-result ${results.connection.success ? 'success' : 'error'}`}
              >
                <h3>Supabase 연결</h3>
                <div className="auth-test-result-message">
                  {results.connection.success ? '✅' : '❌'} {results.connection.message}
                </div>
                {results.connection.details && (
                  <details className="auth-test-result-details">
                    <summary>상세 정보</summary>
                    <pre>{JSON.stringify(results.connection.details, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}

            {results.googleLogin && (
              <div
                className={`auth-test-result ${results.googleLogin.success ? 'success' : 'error'}`}
              >
                <h3>Google 로그인</h3>
                <div className="auth-test-result-message">
                  {results.googleLogin.success ? '✅' : '❌'} {results.googleLogin.message}
                </div>
                {results.googleLogin.details && (
                  <details className="auth-test-result-details">
                    <summary>상세 정보</summary>
                    <pre>{JSON.stringify(results.googleLogin.details, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {/* 안내 */}
        <div className="auth-test-section">
          <h2>📋 확인 사항</h2>
          <div className="auth-test-checklist">
            <div className="auth-test-checklist-item">
              <input type="checkbox" checked={!!ENV.SUPABASE_URL} readOnly />
              <label>Supabase URL이 설정되어 있음</label>
            </div>
            <div className="auth-test-checklist-item">
              <input type="checkbox" checked={!!ENV.SUPABASE_ANON_KEY} readOnly />
              <label>Supabase Anon Key가 설정되어 있음</label>
            </div>
            <div className="auth-test-checklist-item">
              <input type="checkbox" checked={callbackUrl.includes('/auth/callback')} readOnly />
              <label>콜백 URL이 올바른 형식임</label>
            </div>
            <div className="auth-test-checklist-item">
              <input type="checkbox" checked={callbackUrl.startsWith('http')} readOnly />
              <label>콜백 URL이 http/https로 시작함</label>
            </div>
            <div className="auth-test-checklist-item">
              <input type="checkbox" />
              <label>Supabase 대시보드에 콜백 URL이 등록되어 있음</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
