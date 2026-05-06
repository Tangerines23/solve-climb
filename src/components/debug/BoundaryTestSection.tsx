import React from 'react';
import { useBoundaryDebugBridge } from '../../hooks/useBoundaryDebugBridge';

export const BoundaryTestSection = React.memo(function BoundaryTestSection() {
  const {
    isUpdating,
    message,
    handleStaminaSet,
    handleMineralsSet,
    handleTierSet,
    handleMasteryScoreSet,
  } = useBoundaryDebugBridge();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
        <h3 className="text-xl font-bold text-white tracking-tight">🔬 경계값 테스트</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stamina */}
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            스태미나 설정
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 5, 10, 999].map((val) => (
              <button
                key={val}
                onClick={() => handleStaminaSet(val)}
                disabled={isUpdating}
                className="py-2 bg-slate-700/50 hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all active:scale-95"
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Minerals */}
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            미네랄 설정
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 10000, 999999].map((val) => (
              <button
                key={val}
                onClick={() => handleMineralsSet(val)}
                disabled={isUpdating}
                className="py-2 bg-slate-700/50 hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all active:scale-95"
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Tier */}
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            티어 설정 (Level)
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 0, n: '베이스' },
              { l: 1, n: '등산로' },
              { l: 6, n: '전설' },
            ].map((item) => (
              <button
                key={item.l}
                onClick={() => handleTierSet(item.l)}
                disabled={isUpdating}
                className="py-2 px-1 bg-slate-700/50 hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-xs font-medium transition-all active:scale-95"
              >
                {item.l} ({item.n})
              </button>
            ))}
          </div>
        </div>

        {/* Mastery Score */}
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            마스터리 점수
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[0, 250000, 2500000].map((val) => (
              <button
                key={val}
                onClick={() => handleMasteryScoreSet(val)}
                disabled={isUpdating}
                className="py-2 bg-slate-700/50 hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-xs font-medium transition-all active:scale-95"
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}
        >
          <span className="text-lg">{message.type === 'success' ? '✅' : '❌'}</span>
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
});
