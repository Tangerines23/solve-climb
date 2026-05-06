import React, { useState } from 'react';
import { useDummyPlayerDebugBridge } from '../../hooks/useDummyPlayerDebugBridge';
import { ConfirmModal } from '../ConfirmModal';

export const DummyPlayerManager: React.FC = () => {
  const {
    dummyPlayers,
    isLoading,
    message,
    handleCreateDummy,
    handleDeleteDummy,
    handleDeleteAll,
  } = useDummyPlayerDebugBridge();

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👥</span> 더미 플레이어 관리
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-normal">
            {dummyPlayers.length}
          </span>
        </h4>
        <button
          onClick={() =>
            openConfirm(
              '전체 더미 삭제',
              '모든 더미 플레이어와 기록을 삭제하시겠습니까?',
              handleDeleteAll
            )
          }
          disabled={dummyPlayers.length === 0 || isLoading}
          className="px-3 py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded text-xs font-bold transition-colors border border-red-900/30 disabled:opacity-30"
        >
          전체 삭제
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => handleCreateDummy('newbie')}
          disabled={isLoading}
          className="p-2 bg-green-900/20 text-green-400 hover:bg-green-900/40 rounded border border-green-900/30 text-xs font-bold transition-all disabled:opacity-30"
        >
          🌱 뉴비 생성
        </button>
        <button
          onClick={() => handleCreateDummy('regular')}
          disabled={isLoading}
          className="p-2 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 rounded border border-blue-900/30 text-xs font-bold transition-all disabled:opacity-30"
        >
          👤 일반 생성
        </button>
        <button
          onClick={() => handleCreateDummy('veteran')}
          disabled={isLoading}
          className="p-2 bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 rounded border border-purple-900/30 text-xs font-bold transition-all disabled:opacity-30"
        >
          🔥 고인물 생성
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm animate-in fade-in zoom-in-95 ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400 border border-green-900/50'
              : 'bg-red-900/30 text-red-400 border border-red-900/50'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {dummyPlayers.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm border-2 border-dashed border-gray-800 rounded-lg">
            데이터가 없습니다.
          </div>
        ) : (
          dummyPlayers.map((player) => (
            <div
              key={player.id}
              className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-between hover:border-gray-600 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{player.nickname}</span>
                  <span
                    className={`text-[10px] px-1.5 rounded uppercase font-bold ${
                      player.persona_type === 'newbie'
                        ? 'bg-green-900/40 text-green-400'
                        : player.persona_type === 'regular'
                          ? 'bg-blue-900/40 text-blue-400'
                          : 'bg-purple-900/40 text-purple-400'
                    }`}
                  >
                    {player.persona_type}
                  </span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-[11px] text-gray-400">🏆 {player.total_mastery_score}</span>
                  <span className="text-[11px] text-gray-400">
                    🛡️ Tier {player.current_tier_level}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  openConfirm('더미 삭제', `"${player.nickname}"를 삭제하시겠습니까?`, () =>
                    handleDeleteDummy(player.id)
                  )
                }
                disabled={isLoading}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
              >
                <span className="text-xs">삭제</span>
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
        variant="danger"
      />
    </div>
  );
};
