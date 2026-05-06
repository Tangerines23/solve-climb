import { useAuthModeDebugBridge } from '../../hooks/useAuthModeDebugBridge';
import { STATUS } from '@/constants/status';
import './AuthModeSection.css';

export function AuthModeSection() {
  const { currentMode, actualMode, user, testResults, loading, handleModeChange } =
    useAuthModeDebugBridge();

  return (
    <div className="debug-section">
      <h3>🔐 인증 모드 테스트</h3>

      <div className="debug-user-info-box">
        <p>
          <strong>현재 실제 상태:</strong>{' '}
          {actualMode === 'authenticated' ? '✅ 로그인됨' : '❌ 익명'}
        </p>
        {user && (
          <p>
            <strong>User ID:</strong> {user.id.slice(0, 8)}...
          </p>
        )}
      </div>

      <div className="debug-button-group">
        <button
          onClick={() => handleModeChange('anonymous')}
          className={currentMode === 'anonymous' ? 'active' : ''}
          disabled={loading}
        >
          👤 익명 모드 테스트
        </button>
        <button
          onClick={() => handleModeChange('authenticated')}
          className={currentMode === 'authenticated' ? 'active' : ''}
          disabled={loading}
        >
          ✅ 일반 계정 테스트
        </button>
        <button
          onClick={() => handleModeChange('developer')}
          className={currentMode === 'developer' ? 'active' : ''}
          disabled={loading}
        >
          🔧 개발자 모드 테스트
        </button>
      </div>

      <div className="debug-hint-box">
        <p>
          ℹ️ <strong>익명 모드 테스트</strong> 클릭 시 현재 세션에서 로그아웃됩니다.
        </p>
      </div>

      {loading && <p>테스트 중...</p>}

      {Object.keys(testResults).length > 0 && (
        <div className="debug-results">
          <h4>📊 접근 테스트 결과</h4>

          <div className="test-result-item">
            <strong>랭킹 뷰 (ranking_view):</strong>
            <span className={testResults.ranking_view?.accessible ? STATUS.SUCCESS : STATUS.ERROR}>
              {testResults.ranking_view?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
            {(testResults.ranking_view?.data ?? 0) > 0 && (
              <span> - {testResults.ranking_view?.data}건 조회</span>
            )}
          </div>

          <div className="test-result-item">
            <strong>전체 프로필 (profiles):</strong>
            <span className={testResults.profiles_all?.accessible ? STATUS.SUCCESS : STATUS.ERROR}>
              {testResults.profiles_all?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
            {testResults.profiles_all?.error && (
              <div className="error-detail">⚠️ {testResults.profiles_all.error}</div>
            )}
          </div>

          <div className="test-result-item">
            <strong>내 프로필:</strong>
            <span className={testResults.own_profile?.accessible ? STATUS.SUCCESS : STATUS.ERROR}>
              {testResults.own_profile?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
            {(testResults.own_profile?.columns ?? 0) > 0 && (
              <span> - {testResults.own_profile?.columns}개 컬럼</span>
            )}
          </div>

          <div className="test-result-item">
            <strong>게임 설정 (game_config):</strong>
            <span className={testResults.game_config?.accessible ? STATUS.SUCCESS : STATUS.ERROR}>
              {testResults.game_config?.accessible ? '✅ 접근 가능' : '❌ 접근 불가'}
            </span>
          </div>

          <div className="test-result-item">
            <strong>게임 플레이:</strong>
            <span className={testResults.game_play?.accessible ? STATUS.SUCCESS : STATUS.ERROR}>
              {testResults.game_play?.accessible ? '✅ 가능' : '❌ 불가능'}
            </span>
            {testResults.game_play?.error && (
              <div className="error-detail">⚠️ {testResults.game_play.error}</div>
            )}
          </div>
        </div>
      )}

      <div className="debug-info-list">
        <h4>📋 모드별 차이</h4>
        <ul>
          <li>
            <strong>익명:</strong> 랭킹, 게임 설정만 조회 가능
          </li>
          <li>
            <strong>일반 계정:</strong> 게임 플레이, 자기 정보 조회/수정 가능
          </li>
          <li>
            <strong>개발자:</strong> 디버그 기능 + 모든 권한
          </li>
        </ul>
      </div>
    </div>
  );
}
