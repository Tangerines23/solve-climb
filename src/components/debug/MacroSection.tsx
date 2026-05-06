import React from 'react';
import { useMacroDebugBridge } from '../../hooks/useMacroDebugBridge';

export const MacroSection: React.FC = React.memo(function MacroSection() {
  const { macros, isRunning, currentMacroId, progress, lastResult, handleRunMacro } =
    useMacroDebugBridge();

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🎬</span> 시나리오 매크로
        </h3>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            실행 중...
          </div>
        )}
      </div>

      <div className="space-y-3">
        {macros.map((macro) => {
          const isCurrent = currentMacroId === macro.id;
          return (
            <div
              key={macro.id}
              className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                isCurrent
                  ? 'bg-blue-900/20 border-blue-500/50'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{macro.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{macro.name}</div>
                  <div className="text-xs text-gray-400">{macro.description}</div>
                </div>
              </div>
              <button
                onClick={() => handleRunMacro(macro.id)}
                disabled={isRunning}
                className={`px-4 py-2 rounded text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-30'
                }`}
              >
                {isCurrent ? `${progress.step}/${progress.total}` : '실행'}
              </button>
            </div>
          );
        })}
      </div>

      {lastResult && (
        <div
          className={`mt-4 p-3 rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            lastResult.success
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}
        >
          <span className="text-lg">{lastResult.success ? '✅' : '❌'}</span>
          <div className="text-sm">
            {lastResult.success
              ? `${lastResult.completedSteps}/${lastResult.totalSteps} 단계 완료`
              : `오류: ${lastResult.error}`}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-900/10 rounded-lg border border-blue-900/20">
        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
          매크로 도움말
        </h4>
        <ul className="space-y-1.5">
          {[
            '매크로는 여러 동작을 순차적으로 실행합니다.',
            '실행 중에는 다른 매크로를 실행할 수 없습니다.',
            '페이지 이동, 리소스 설정 등이 자동으로 처리됩니다.',
          ].map((text, i) => (
            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-blue-500">•</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
