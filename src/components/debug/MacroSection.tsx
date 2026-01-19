import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/useUserStore';
import { builtInMacros, executeMacro, type MacroExecutionResult } from '../../utils/debugMacros';
import './MacroSection.css';

export const MacroSection = React.memo(function MacroSection() {
  const navigate = useNavigate();
  const { setStamina, setMinerals } = useUserStore();

  const [isRunning, setIsRunning] = useState(false);
  const [currentMacroId, setCurrentMacroId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: 0, total: 0 });
  const [lastResult, setLastResult] = useState<MacroExecutionResult | null>(null);

  const handleRunMacro = async (macroId: string) => {
    const macro = builtInMacros.find((m) => m.id === macroId);
    if (!macro || isRunning) return;

    setIsRunning(true);
    setCurrentMacroId(macroId);
    setProgress({ step: 0, total: macro.steps.length });
    setLastResult(null);

    // 타입 래퍼: store 함수가 void를 반환해도 Promise로 래핑
    const wrappedSetStamina = async (v: number) => {
      await Promise.resolve(setStamina(v));
    };
    const wrappedSetMinerals = async (v: number) => {
      await Promise.resolve(setMinerals(v));
    };

    const result = await executeMacro(
      macro,
      navigate,
      wrappedSetStamina,
      wrappedSetMinerals,
      (step, total) => setProgress({ step, total })
    );

    setLastResult(result);
    setIsRunning(false);
    setCurrentMacroId(null);
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🎬 시나리오 매크로</h3>

      <div className="debug-macro-list">
        {builtInMacros.map((macro) => (
          <div
            key={macro.id}
            className={`debug-macro-item ${currentMacroId === macro.id ? 'running' : ''}`}
          >
            <div className="debug-macro-info">
              <span className="debug-macro-icon">{macro.icon}</span>
              <div className="debug-macro-text">
                <span className="debug-macro-name">{macro.name}</span>
                <span className="debug-macro-description">{macro.description}</span>
              </div>
            </div>
            <button
              className="debug-macro-run-button"
              onClick={() => handleRunMacro(macro.id)}
              disabled={isRunning}
            >
              {currentMacroId === macro.id ? `${progress.step}/${progress.total}` : '실행'}
            </button>
          </div>
        ))}
      </div>

      {lastResult && (
        <div className={`debug-macro-result ${lastResult.success ? 'success' : 'error'}`}>
          <span className="debug-macro-result-icon">{lastResult.success ? '✅' : '❌'}</span>
          <span className="debug-macro-result-text">
            {lastResult.success
              ? `${lastResult.completedSteps}/${lastResult.totalSteps} 단계 완료`
              : `오류: ${lastResult.error}`}
          </span>
        </div>
      )}

      <div className="debug-macro-info-box">
        <h4 className="debug-subsection-title">매크로 사용법</h4>
        <ul className="debug-macro-help-list">
          <li>매크로는 여러 동작을 순차적으로 실행합니다</li>
          <li>실행 중에는 다른 매크로를 실행할 수 없습니다</li>
          <li>페이지 이동, 리소스 설정 등이 자동으로 처리됩니다</li>
        </ul>
      </div>
    </div>
  );
});
