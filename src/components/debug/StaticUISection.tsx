import React from 'react';
import { useSettingsActions } from '../../hooks/useSettingsActions';
import './StaticUISection.css';

export const StaticUISection = React.memo(function StaticUISection() {
  const { animationEnabled, setAnimationEnabled } = useSettingsActions();

  const dynamicEffects = [
    { title: 'Fever Particles', desc: '피버 모드 시 화면 하단에서 솟구치는 불꽃 효과' },
    { title: 'Shake & Flash', desc: '오답 시 카드 흔들림 및 퀴즈 카드의 시각적 번쩍임' },
    { title: 'Pulse Effects', desc: '점수 알약 맥동 및 타이머 3초 전 심박수 진동 효과' },
    { title: 'Slide Toasts', desc: '획득 점수가 생성된 위치에서 위로 스르륵 사라지는 효과' },
    { title: 'Landmark Popups', desc: '특정 고도 도달 시 나타나는 화려한 축하 팝업 애니메이션' },
    { title: 'Global Transitions', desc: '페이지 이동 및 모달 노출 시의 부드러운 전환 효과' },
  ];

  return (
    <div className="debug-section static-ui-section">
      <h3 className="debug-section-title">🔇 시각 효과 관리 (정적 UI)</h3>

      <div className="debug-toggle-item main-toggle">
        <div className="debug-toggle-info">
          <span className="debug-toggle-label">정적 UI 모드 활성화</span>
          <span className="debug-toggle-description">
            {animationEnabled
              ? '현재 모든 애니메이션이 동작 중입니다.'
              : '현재 모든 움직이는 효과가 물리적으로 차단되었습니다.'}
          </span>
        </div>
        <button
          className={`debug-toggle-button ${!animationEnabled ? 'active' : ''}`}
          onClick={() => setAnimationEnabled(!animationEnabled)}
          aria-label="정적 UI 모드 토글"
        >
          {!animationEnabled ? 'ACTIVE' : 'OFF'}
        </button>
      </div>

      <div className="static-effects-audit">
        <h4 className="debug-subsection-title">제어 대상 효과 리스트</h4>
        <div className="static-effects-grid">
          {dynamicEffects.map((effect, index) => (
            <div
              key={index}
              className={`static-effect-card ${!animationEnabled ? 'suppressed' : ''}`}
            >
              <div className="effect-card-header">
                <span className="effect-title">{effect.title}</span>
                <span className="effect-status-tag">{!animationEnabled ? '차단됨' : '허용됨'}</span>
              </div>
              <p className="effect-description">{effect.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="static-ui-notice">
        <p>
          ※ 정적 UI 모드는 퀴즈 풀이 몰입감을 극대화하기 위해 설계되었습니다. 모든 애니메이션은 CSS
          레벨에서 강제 차단(!important)됩니다.
        </p>
      </div>
    </div>
  );
});
