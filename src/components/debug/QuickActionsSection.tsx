import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import { useDebugStore } from '../../stores/useDebugStore';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import {
  debugPresets,
  applyPreset,
  getPresetHistories,
  clearPresetHistory,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  exportCustomPresets,
  importCustomPresets,
  type PresetHistory,
  type CustomPreset,
} from '../../utils/debugPresets';
import { verifySync, type SyncResult } from '../../utils/debugSync';
import { CustomPresetModal } from './CustomPresetModal';
import { ConfirmModal } from '../ConfirmModal';
import './QuickActionsSection.css';

export const QuickActionsSection = React.memo(function QuickActionsSection() {
  const {
    minerals,
    stamina,
    fetchUserData,
    setMinerals,
    setStamina,
    rewardMinerals,
    debugSetStamina,
  } = useUserStore();
  const {
    infiniteStamina,
    infiniteMinerals,
    infiniteTime,
    setInfiniteStamina,
    setInfiniteMinerals,
    setInfiniteTime,
  } = useDebugStore();
  const { refetch } = useMyPageStats();

  const [staminaInput, setStaminaInput] = useState(stamina.toString());
  const [mineralsInput, setMineralsInput] = useState(minerals.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [presetMessage, setPresetMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [presetHistories, setPresetHistories] = useState<PresetHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isVerifyingSync, setIsVerifyingSync] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [showCustomPresets, setShowCustomPresets] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);

  // 디버깅용 유저 정보
  const [debugUserInfo, setDebugUserInfo] = useState<{ id: string; email?: string; hasProfile: boolean } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('id', user.id);
        setDebugUserInfo({
          id: user.id,
          email: user.email,
          hasProfile: count !== null && count > 0
        });
      } else {
        setDebugUserInfo(null);
      }
    };
    checkUser();
  }, []);

  // 컨펌 모달 상태
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const handleStaminaChange = async (delta: number) => {
    if (isUpdating) return; // 중복 클릭 방지

    setIsUpdating(true);
    try {
      const newValue = Math.max(0, stamina + delta);
      setStaminaInput(newValue.toString());
      await debugSetStamina(newValue);
    } catch (e) {
      console.error('Failed to update stamina:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStaminaInputChange = (value: string) => {
    setStaminaInput(value);
  };

  const handleStaminaInputBlur = async () => {
    const numValue = parseInt(staminaInput, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setIsUpdating(true);
      await setStamina(numValue);
      await fetchUserData();
      setIsUpdating(false);
    } else {
      setStaminaInput(stamina.toString());
    }
  };

  const handleMineralsChange = async (delta: number) => {
    if (isUpdating) return; // 중복 클릭 방지

    setIsUpdating(true);
    try {
      const newValue = Math.max(0, minerals + delta);
      setMineralsInput(newValue.toString());

      if (delta > 0) {
        // 양수는 rewardMinerals 사용 (보너스 등 로그 처리 가능)
        await rewardMinerals(delta);
      } else {
        // 음수는 RPC 직접 호출 (차감)
        // rewardMinerals는 기본적으로 양수만 허용하므로
        // add_minerals RPC는 음수값도 처리 가능하다고 가정 (DB 함수 로직상)
        const { error } = await supabase.rpc('add_minerals', { p_amount: delta });
        if (error) throw error;
        await fetchUserData();
      }
    } catch (e) {
      console.error('Failed to update minerals:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMineralsInputChange = (value: string) => {
    setMineralsInput(value);
  };

  const handleMineralsInputBlur = async () => {
    const numValue = parseInt(mineralsInput, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setIsUpdating(true);
      await setMinerals(numValue);
      await fetchUserData();
      setIsUpdating(false);
    } else {
      setMineralsInput(minerals.toString());
    }
  };

  useEffect(() => {
    // 히스토리 및 커스텀 프리셋 로드
    setPresetHistories(getPresetHistories());
    setCustomPresets(getCustomPresets());
  }, []);

  const handlePresetApply = async (presetId: string) => {
    if (isApplyingPreset) return;

    try {
      setIsApplyingPreset(true);
      setPresetMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setPresetMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      await applyPreset(presetId, user.id, refetch);
      setPresetMessage({ type: 'success', text: '프리셋이 적용되었습니다.' });

      // 히스토리 새로고침
      setPresetHistories(getPresetHistories());
    } catch (err) {
      setPresetMessage({
        type: 'error',
        text: `프리셋 적용 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });

      // 히스토리 새로고침 (실패 기록 포함)
      setPresetHistories(getPresetHistories());
    } finally {
      setIsApplyingPreset(false);
    }
  };

  const handleHistoryReapply = async (history: PresetHistory) => {
    if (isApplyingPreset) return;
    await handlePresetApply(history.presetId);
  };

  const handleClearHistory = () => {
    setConfirmConfig({
      isOpen: true,
      title: '히스토리 삭제',
      message: '히스토리를 모두 삭제하시겠습니까?',
      onConfirm: () => {
        clearPresetHistory();
        setPresetHistories([]);
        setPresetMessage({ type: 'success', text: '히스토리가 삭제되었습니다.' });
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleVerifySync = async () => {
    if (isVerifyingSync) return;

    try {
      setIsVerifyingSync(true);
      setSyncResult(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setPresetMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const result = await verifySync(user.id);
      setSyncResult(result);
      setPresetMessage({ type: 'success', text: '동기화 검증이 완료되었습니다.' });
    } catch (err) {
      setPresetMessage({
        type: 'error',
        text: `동기화 검증 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsVerifyingSync(false);
    }
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">📊 게임 상태</h3>

      {/* 유저 디버그 정보 표시 */}
      <div className="debug-user-info-box">
        <strong>Current User:</strong> {debugUserInfo ? `${debugUserInfo.id.slice(0, 8)}...` : 'Not Logged In'}<br />
        <strong>Profile Exists:</strong> {debugUserInfo ? (debugUserInfo.hasProfile ? '✅ Yes' : '❌ No (DB Update Failed)') : '-'}
      </div>

      <div className="debug-sync-control">
        <button className="debug-sync-button" onClick={handleVerifySync} disabled={isVerifyingSync}>
          {isVerifyingSync ? '검증 중...' : '동기화 확인'}
        </button>
      </div>

      {syncResult && (
        <div className="debug-sync-result">
          <h4 className="debug-subsection-title">동기화 검증 결과</h4>
          <div className="debug-sync-item">
            <span className="debug-sync-label">프로필:</span>
            <span
              className={`debug-sync-status ${syncResult.profile.synced ? 'success' : 'error'}`}
            >
              {syncResult.profile.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">티어:</span>
            <span className={`debug-sync-status ${syncResult.tier.synced ? 'success' : 'error'}`}>
              {syncResult.tier.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">뱃지:</span>
            <span className={`debug-sync-status ${syncResult.badges.synced ? 'success' : 'error'}`}>
              {syncResult.badges.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          <div className="debug-sync-item">
            <span className="debug-sync-label">인벤토리:</span>
            <span
              className={`debug-sync-status ${syncResult.inventory.synced ? 'success' : 'error'}`}
            >
              {syncResult.inventory.synced ? '✅ 동기화됨' : '❌ 문제 있음'}
            </span>
          </div>
          {(syncResult.profile.issues.length > 0 ||
            syncResult.tier.issues.length > 0 ||
            syncResult.badges.issues.length > 0 ||
            syncResult.inventory.issues.length > 0) && (
              <div className="debug-sync-issues">
                <h5 className="debug-sync-issues-title">발견된 문제:</h5>
                <ul className="debug-sync-issues-list">
                  {syncResult.profile.issues.map((issue, idx) => (
                    <li key={`profile-${idx}`}>{issue}</li>
                  ))}
                  {syncResult.tier.issues.map((issue, idx) => (
                    <li key={`tier-${idx}`}>{issue}</li>
                  ))}
                  {syncResult.badges.issues.map((issue, idx) => (
                    <li key={`badges-${idx}`}>{issue}</li>
                  ))}
                  {syncResult.inventory.issues.map((issue, idx) => (
                    <li key={`inventory-${idx}`}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      <div className="debug-resource-control">
        <div className="debug-resource-item">
          <label htmlFor="debug-stamina-input" className="debug-resource-label">
            스태미나
          </label>
          <div className="debug-resource-input-group">
            <button
              className="debug-resource-button"
              onClick={() => handleStaminaChange(-1)}
              disabled={isUpdating}
            >
              -1
            </button>
            <input
              type="number"
              id="debug-stamina-input"
              name="stamina"
              className="debug-resource-input"
              value={staminaInput}
              onChange={(e) => handleStaminaInputChange(e.target.value)}
              onBlur={handleStaminaInputBlur}
              min="0"
              disabled={isUpdating}
            />
            <button
              className="debug-resource-button"
              onClick={() => handleStaminaChange(1)}
              disabled={isUpdating}
            >
              +1
            </button>
          </div>
        </div>

        <div className="debug-resource-item">
          <label htmlFor="debug-minerals-input" className="debug-resource-label">
            미네랄
          </label>
          <div className="debug-resource-input-group">
            <button
              className="debug-resource-button"
              onClick={() => handleMineralsChange(-100)}
              disabled={isUpdating}
            >
              -100
            </button>
            <input
              type="number"
              id="debug-minerals-input"
              name="minerals"
              className="debug-resource-input"
              value={mineralsInput}
              onChange={(e) => handleMineralsInputChange(e.target.value)}
              onBlur={handleMineralsInputBlur}
              min="0"
              disabled={isUpdating}
            />
            <button
              className="debug-resource-button"
              onClick={() => handleMineralsChange(100)}
              disabled={isUpdating}
            >
              +100
            </button>
          </div>
        </div>
      </div>

      <div className="debug-infinite-modes">
        <h4 className="debug-subsection-title">무한 모드</h4>

        <div className="debug-toggle-item">
          <span className="debug-toggle-label">무한 스태미나</span>
          <button
            className={`debug-toggle-button ${infiniteStamina ? 'active' : ''}`}
            onClick={() => setInfiniteStamina(!infiniteStamina)}
            aria-label="무한 스태미나 토글"
          >
            {infiniteStamina ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-toggle-item">
          <span className="debug-toggle-label">무한 미네랄</span>
          <button
            className={`debug-toggle-button ${infiniteMinerals ? 'active' : ''}`}
            onClick={() => setInfiniteMinerals(!infiniteMinerals)}
            aria-label="무한 미네랄 토글"
          >
            {infiniteMinerals ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-toggle-item">
          <span className="debug-toggle-label">무한 시간</span>
          <button
            className={`debug-toggle-button ${infiniteTime ? 'active' : ''}`}
            onClick={() => setInfiniteTime(!infiniteTime)}
            aria-label="무한 시간 토글"
          >
            {infiniteTime ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="debug-preset-section">
        <div className="debug-preset-header">
          <h4 className="debug-subsection-title">프리셋</h4>
          <button
            className="debug-preset-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '히스토리 숨기기' : '히스토리 보기'}
          </button>
        </div>

        {showHistory && presetHistories.length > 0 && (
          <div className="debug-preset-history-section">
            <div className="debug-preset-history-header">
              <span className="debug-preset-history-title">최근 적용 내역</span>
              <button className="debug-preset-history-clear" onClick={handleClearHistory}>
                전체 삭제
              </button>
            </div>
            <div className="debug-preset-history-list">
              {presetHistories.slice(0, 10).map((history) => (
                <div
                  key={history.id}
                  className={`debug-preset-history-item ${history.success ? 'success' : 'error'}`}
                >
                  <div className="debug-preset-history-info">
                    <div className="debug-preset-history-name">
                      {history.success ? '✅' : '❌'} {history.presetName}
                    </div>
                    <div className="debug-preset-history-time">
                      {new Date(history.appliedAt).toLocaleString('ko-KR')}
                    </div>
                    {history.error && (
                      <div className="debug-preset-history-error">{history.error}</div>
                    )}
                  </div>
                  <button
                    className="debug-preset-history-reapply"
                    onClick={() => handleHistoryReapply(history)}
                    disabled={isApplyingPreset || !history.success}
                    title="다시 적용"
                  >
                    재적용
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showHistory && presetHistories.length === 0 && (
          <div className="debug-preset-history-empty">적용된 프리셋 히스토리가 없습니다.</div>
        )}

        <div className="debug-preset-list">
          {debugPresets.map((preset) => (
            <div key={preset.id} className="debug-preset-item">
              <button
                className="debug-preset-button"
                onClick={() => handlePresetApply(preset.id)}
                disabled={isApplyingPreset}
              >
                {preset.name}
              </button>
              <div className="debug-preset-description">{preset.description}</div>
            </div>
          ))}
        </div>
        {presetMessage && (
          <div className={`debug-message debug-message-${presetMessage.type}`}>
            {presetMessage.text}
          </div>
        )}

        {/* 커스텀 프리셋 섹션 */}
        <div className="debug-custom-presets-section">
          <div className="debug-preset-header">
            <h4 className="debug-subsection-title">커스텀 프리셋</h4>
            <div className="debug-custom-presets-actions">
              <button
                className="debug-custom-preset-button"
                onClick={() => {
                  setEditingPreset(null);
                  setShowPresetModal(true);
                }}
              >
                프리셋 추가
              </button>
              <button
                className="debug-custom-preset-button"
                onClick={() => setShowCustomPresets(!showCustomPresets)}
              >
                {showCustomPresets ? '목록 숨기기' : '목록 보기'}
              </button>
            </div>
          </div>

          {showCustomPresets && (
            <div className="debug-custom-presets-list">
              {customPresets.length === 0 ? (
                <div className="debug-custom-presets-empty">커스텀 프리셋이 없습니다.</div>
              ) : (
                customPresets.map((preset) => (
                  <div key={preset.id} className="debug-custom-preset-item">
                    <div className="debug-custom-preset-info">
                      <div className="debug-custom-preset-name">{preset.name}</div>
                      <div className="debug-custom-preset-description">{preset.description}</div>
                    </div>
                    <div className="debug-custom-preset-actions">
                      <button
                        className="debug-custom-preset-action-button"
                        onClick={() => handlePresetApply(preset.id)}
                        disabled={isApplyingPreset}
                      >
                        적용
                      </button>
                      <button
                        className="debug-custom-preset-action-button"
                        onClick={() => {
                          setEditingPreset(preset);
                          setShowPresetModal(true);
                        }}
                      >
                        편집
                      </button>
                      <button
                        className="debug-custom-preset-action-button debug-custom-preset-delete-button"
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: '프리셋 삭제',
                            message: `프리셋 "${preset.name}"을 삭제하시겠습니까?`,
                            onConfirm: () => {
                              deleteCustomPreset(preset.id);
                              setCustomPresets(getCustomPresets());
                              setPresetMessage({
                                type: 'success',
                                text: '프리셋이 삭제되었습니다.',
                              });
                              setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                            },
                          });
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="debug-custom-presets-export">
            <button
              className="debug-custom-preset-button"
              onClick={() => {
                try {
                  const json = exportCustomPresets();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `custom-presets-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  setPresetMessage({ type: 'success', text: '커스텀 프리셋이 내보내졌습니다.' });
                } catch (err) {
                  setPresetMessage({
                    type: 'error',
                    text: `내보내기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
                  });
                }
              }}
            >
              내보내기
            </button>
            <button
              className="debug-custom-preset-button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const json = event.target?.result as string;
                      importCustomPresets(json);
                      setCustomPresets(getCustomPresets());
                      setPresetMessage({
                        type: 'success',
                        text: '커스텀 프리셋이 가져와졌습니다.',
                      });
                    } catch (err) {
                      setPresetMessage({
                        type: 'error',
                        text: `가져오기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
                      });
                    }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
            >
              가져오기
            </button>
          </div>
        </div>
      </div>

      <CustomPresetModal
        isOpen={showPresetModal}
        editingPreset={editingPreset}
        onClose={() => {
          setShowPresetModal(false);
          setEditingPreset(null);
        }}
        onSave={(preset) => {
          saveCustomPreset(preset);
          setCustomPresets(getCustomPresets());
          setPresetMessage({ type: 'success', text: `프리셋 "${preset.name}"이 저장되었습니다.` });
        }}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  );
});
