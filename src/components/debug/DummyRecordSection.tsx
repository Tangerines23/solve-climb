import React from 'react';
import { useDummyRecordDebugBridge } from '../../hooks/useDummyRecordDebugBridge';

export const DummyRecordSection: React.FC = () => {
  const {
    targetUserId,
    setTargetUserId,
    selectedWorldId,
    setSelectedWorldId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSubjectId,
    setSelectedSubjectId,
    level,
    setLevel,
    correctCount,
    setCorrectCount,
    avgCombo,
    setAvgCombo,
    iterations,
    setIterations,
    isSubmitting,
    message,
    handleSubmit,
    worlds,
    categories,
    subjects,
  } = useDummyRecordDebugBridge();

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🎭</span> 시나리오 시뮬레이터
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          정규화된 World/Subject 계층 구조를 기반으로 정밀한 플레이 시뮬레이션을 수행합니다.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            대상 유저 UUID (비어있으면 본인)
          </label>
          <input
            type="text"
            placeholder="User ID (UUID)"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              월드 (World)
            </label>
            <select
              value={selectedWorldId}
              onChange={(e) => setSelectedWorldId(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                카테고리
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                주제 (Subject)
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              레벨 (1~15)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              정답 수 (0~10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={correctCount}
              onChange={(e) => setCorrectCount(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              평균 콤보
            </label>
            <select
              value={avgCombo}
              onChange={(e) => setAvgCombo(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value={0}>기본 (1.0x)</option>
              <option value={1}>Fever (1.2x)</option>
              <option value={2}>Super Fever (1.5x)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              반복 (1~100)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              시뮬레이션 실행 중...
            </span>
          ) : (
            '시뮬레이션 실행 (New Hierarchy 반영)'
          )}
        </button>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm border animate-in fade-in slide-in-from-bottom-2 ${
              message.type === 'success'
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-start gap-2">
              <span>{message.type === 'success' ? '✅' : '❌'}</span>
              <p>{message.text}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
