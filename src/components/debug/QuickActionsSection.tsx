import React, { useState, useEffect } from 'react';
import {
  useQuickActionsDebugBridge,
  type CustomPreset,
  type DebugPreset,
} from '../../hooks/useQuickActionsDebugBridge';
import { CustomPresetModal } from './CustomPresetModal';
import { ConfirmModal } from '../ConfirmModal';
import './QuickActionsSection.css';

export const QuickActionsSection = React.memo(function QuickActionsSection() {
  const {
    stamina,
    minerals,
    handleStaminaUpdate,
    handleMineralsUpdate,
    isAdminMode,
    toggleAdminMode,
    infiniteStamina,
    infiniteMinerals,
    infiniteTime,
    setInfiniteStamina,
    setInfiniteMinerals,
    setInfiniteTime,
    isUpdating,
    isApplyingPreset,
    presetMessage,
    setPresetMessage,
    presetHistories,
    handlePresetApply,
    handleClearHistory,
    syncResult,
    isVerifyingSync,
    handleVerifySync,
    customPresets,
    handleSaveCustomPreset,
    handleDeleteCustomPreset,
    handleExportPresets,
    handleImportPresets,
    debugUserInfo,
    debugPresets,
  } = useQuickActionsDebugBridge();

  const [staminaInput, setStaminaInput] = useState(stamina.toString());
  const [mineralsInput, setMineralsInput] = useState(minerals.toString());
  const [showHistory, setShowHistory] = useState(false);
  const [showCustomPresets, setShowCustomPresets] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);

  // 스토어 값이 변경될 때 입력 필드 동기화
  useEffect(() => {
    if (document.activeElement?.id !== 'debug-stamina-input' && !isUpdating) {
      setStaminaInput(stamina.toString());
    }
  }, [stamina, isUpdating]);

  useEffect(() => {
    if (document.activeElement?.id !== 'debug-minerals-input' && !isUpdating) {
      setMineralsInput(minerals.toString());
    }
  }, [minerals, isUpdating]);

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
    onConfirm: () => {},
  });

  const handleStaminaChange = (delta: number) => {
    if (isUpdating) return;
    const newValue = Math.max(0, stamina + delta);
    setStaminaInput(newValue.toString());
    handleStaminaUpdate(newValue);
  };

  const handleStaminaInputBlur = () => {
    const numValue = parseInt(staminaInput, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue !== stamina) {
      handleStaminaUpdate(numValue);
    } else {
      setStaminaInput(stamina.toString());
    }
  };

  const handleMineralsChange = (delta: number) => {
    if (isUpdating) return;
    const newValue = Math.max(0, minerals + delta);
    setMineralsInput(newValue.toString());
    handleMineralsUpdate(newValue);
  };

  const handleMineralsInputBlur = () => {
    const numValue = parseInt(mineralsInput, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue !== minerals) {
      handleMineralsUpdate(numValue);
    } else {
      setMineralsInput(minerals.toString());
    }
  };

  const handleClearHistoryConfirm = () => {
    setConfirmConfig({
      isOpen: true,
      title: '히스토리 삭제',
      message: '히스토리를 모두 삭제하시겠습니까?',
      onConfirm: () => {
        handleClearHistory();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">📊 게임 상태</h3>

      <div className="debug-user-info-box">
        <strong>Current User:</strong>{' '}
        {debugUserInfo ? `${debugUserInfo.id.slice(0, 8)}...` : 'Not Logged In'}
        <br />
        <strong>Profile Exists:</strong>{' '}
        {debugUserInfo ? (debugUserInfo.hasProfile ? '✅ Yes' : '❌ No (DB Update Failed)') : '-'}
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
              onChange={(e) => setStaminaInput(e.target.value)}
              onBlur={handleStaminaInputBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              min="0"
              disabled={isUpdating}
            />
            <button
              className="debug-resource-button plus"
              onClick={() => handleStaminaChange(1)}
              disabled={isUpdating}
              aria-label="스태미나 1 추가"
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
              onChange={(e) => setMineralsInput(e.target.value)}
              onBlur={handleMineralsInputBlur}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              min="0"
              disabled={isUpdating}
            />
            <button
              className="debug-resource-button plus"
              onClick={() => handleMineralsChange(100)}
              disabled={isUpdating}
              aria-label="미네랄 100 추가"
            >
              +100
            </button>
          </div>
        </div>
      </div>

      <div className="debug-infinite-modes">
        <h4 className="debug-subsection-title">디버그 설정</h4>

        {!debugUserInfo && (
          <div className="debug-warning-box login-required">
            ⚠️ <strong>로그인 필요:</strong> 이 기능들은 서버 RPC를 호출하므로 로그인이 필요합니다.
            <br />
            (로그인하지 않으면 <code>auth.uid()</code>가 없어 데이터 동기화가 실패합니다.)
          </div>
        )}

        <div className="debug-quick-grid">
          <div className="debug-toggle-item">
            <div className="debug-toggle-header">
              <span className="debug-toggle-label">고급 UI (Admin Mode)</span>
              <button
                className={`debug-toggle-button ${isAdminMode ? 'active' : ''}`}
                onClick={toggleAdminMode}
                aria-label="Admin Mode 토글"
              >
                {isAdminMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="debug-toggle-description">
              Header의 자원 클릭 & +, - 키로 빠른 편집 활성화
            </div>
          </div>

          <div className="debug-toggle-item">
            <div className="debug-toggle-header">
              <span className="debug-toggle-label">무한 스태미나</span>
              <button
                className={`debug-toggle-button ${infiniteStamina ? 'active' : ''}`}
                onClick={() => setInfiniteStamina(!infiniteStamina)}
                aria-label="무한 스태미나 토글"
              >
                {infiniteStamina ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="debug-toggle-item">
            <div className="debug-toggle-header">
              <span className="debug-toggle-label">무한 미네랄</span>
              <button
                className={`debug-toggle-button ${infiniteMinerals ? 'active' : ''}`}
                onClick={() => setInfiniteMinerals(!infiniteMinerals)}
                aria-label="무한 미네랄 토글"
              >
                {infiniteMinerals ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="debug-toggle-item">
            <div className="debug-toggle-header">
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
        </div>

        <div className="debug-shortcut-guide">
          <h5>⌨️ 단축키 안내</h5>
          <ul>
            <li>
              <code>Ctrl + `</code> : 디버그 패널 토글
            </li>
            <li>
              <code>`</code> (백틱) : 스태미나 5, 미네랄 +1000 (즉시 충전)
            </li>
            <li>
              <code>+</code> / <code>-</code> : 선택된 리소스 증가/감소 (Admin Mode ON 시)
            </li>
            <li>
              <code>Esc</code> : 리소스 선택 해제
            </li>
          </ul>
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
              <button className="debug-preset-history-clear" onClick={handleClearHistoryConfirm}>
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
                    onClick={() => handlePresetApply(history.presetId)}
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
          {debugPresets.map((preset: DebugPreset) => (
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
                              handleDeleteCustomPreset(preset.id);
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
                  const json = handleExportPresets();
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
                      handleImportPresets(json);
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
          handleSaveCustomPreset(preset);
          setShowPresetModal(false);
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
