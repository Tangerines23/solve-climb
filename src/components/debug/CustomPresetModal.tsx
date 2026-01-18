import { useState, useEffect } from 'react';
import { DebugAction, CustomPreset } from '../../utils/debugPresets';
import './CustomPresetModal.css';

interface CustomPresetModalProps {
  isOpen: boolean;
  editingPreset: CustomPreset | null;
  onClose: () => void;
  onSave: (preset: CustomPreset) => void;
}

export function CustomPresetModal({
  isOpen,
  editingPreset,
  onClose,
  onSave,
}: CustomPresetModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actions, setActions] = useState<DebugAction[]>([]);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [editingAction, setEditingAction] = useState<DebugAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingPreset) {
        setName(editingPreset.name);
        setDescription(editingPreset.description);
        setActions([...editingPreset.actions]);
      } else {
        setName('');
        setDescription('');
        setActions([]);
      }
      setEditingActionIndex(null);
      setEditingAction(null);
      setErrorMessage(null);
    }
  }, [isOpen, editingPreset]);

  if (!isOpen) return null;

  const handleAddAction = () => {
    setEditingAction({
      type: 'setMinerals',
      value: 0,
    });
    setEditingActionIndex(actions.length);
  };

  const handleEditAction = (index: number) => {
    setEditingAction({ ...actions[index] });
    setEditingActionIndex(index);
  };

  const handleDeleteAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAction = () => {
    if (!editingAction || editingActionIndex === null) return;

    if (editingActionIndex === actions.length) {
      // 새 액션 추가
      setActions((prev) => [...prev, editingAction]);
    } else {
      // 기존 액션 수정
      setActions((prev) =>
        prev.map((action, i) => (i === editingActionIndex ? editingAction : action))
      );
    }

    setEditingAction(null);
    setEditingActionIndex(null);
  };

  const handleCancelAction = () => {
    setEditingAction(null);
    setEditingActionIndex(null);
  };

  const handleSave = () => {
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('프리셋 이름을 입력하세요.');
      return;
    }

    if (actions.length === 0) {
      setErrorMessage('최소 하나의 액션을 추가하세요.');
      return;
    }

    const preset: CustomPreset = {
      id: editingPreset?.id || `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      actions,
      isCustom: true,
    };

    onSave(preset);
    onClose();
  };

  const getActionTypeLabel = (type: DebugAction['type']): string => {
    const labels: Record<DebugAction['type'], string> = {
      reset: '초기화',
      setTier: '티어 설정',
      setMasteryScore: '마스터리 점수 설정',
      setMinerals: '미네랄 설정',
      setStamina: '스태미나 설정',
      grantAllItems: '모든 아이템 지급',
      grantAllBadges: '모든 뱃지 지급',
      setGameTime: '게임 시간 설정',
    };
    return labels[type] || type;
  };

  return (
    <div className="custom-preset-modal-overlay" onClick={onClose}>
      <div className="custom-preset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-preset-modal-header">
          <h3>{editingPreset ? '프리셋 편집' : '프리셋 추가'}</h3>
          <button className="custom-preset-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="custom-preset-modal-content">
          {errorMessage && <div className="custom-preset-modal-error">{errorMessage}</div>}

          <div className="custom-preset-modal-field">
            <label htmlFor="custom-preset-name-input" className="custom-preset-modal-label">
              프리셋 이름:
            </label>
            <input
              type="text"
              id="custom-preset-name-input"
              name="presetName"
              className="custom-preset-modal-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="예: 내 커스텀 프리셋"
            />
          </div>

          <div className="custom-preset-modal-field">
            <label
              htmlFor="custom-preset-description-textarea"
              className="custom-preset-modal-label"
            >
              설명:
            </label>
            <textarea
              id="custom-preset-description-textarea"
              name="presetDescription"
              className="custom-preset-modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="프리셋에 대한 설명을 입력하세요"
              rows={2}
            />
          </div>

          <div className="custom-preset-modal-actions-section">
            <div className="custom-preset-modal-actions-header">
              <span className="custom-preset-modal-label">액션:</span>
              <button
                className="custom-preset-modal-add-action-button"
                onClick={handleAddAction}
                aria-label="액션 추가"
              >
                액션 추가
              </button>
            </div>

            {actions.length > 0 && (
              <div className="custom-preset-modal-actions-list">
                {actions.map((action, index) => (
                  <div key={index} className="custom-preset-modal-action-item">
                    <div className="custom-preset-modal-action-info">
                      <span className="custom-preset-modal-action-type">
                        {getActionTypeLabel(action.type)}
                      </span>
                      {action.level !== undefined && (
                        <span className="custom-preset-modal-action-param">
                          레벨: {action.level}
                        </span>
                      )}
                      {action.value !== undefined && (
                        <span className="custom-preset-modal-action-param">값: {action.value}</span>
                      )}
                      {action.quantity !== undefined && (
                        <span className="custom-preset-modal-action-param">
                          수량: {action.quantity}
                        </span>
                      )}
                      {action.seconds !== undefined && (
                        <span className="custom-preset-modal-action-param">
                          초: {action.seconds}
                        </span>
                      )}
                    </div>
                    <div className="custom-preset-modal-action-buttons">
                      <button
                        className="custom-preset-modal-action-button"
                        onClick={() => handleEditAction(index)}
                      >
                        편집
                      </button>
                      <button
                        className="custom-preset-modal-action-button custom-preset-modal-action-delete"
                        onClick={() => handleDeleteAction(index)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingAction !== null && (
              <div className="custom-preset-modal-action-editor">
                <div className="custom-preset-modal-field">
                  <label
                    htmlFor="custom-preset-action-type-select"
                    className="custom-preset-modal-label"
                  >
                    액션 타입:
                  </label>
                  <select
                    id="custom-preset-action-type-select"
                    name="actionType"
                    className="custom-preset-modal-select"
                    value={editingAction.type}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        type: e.target.value as DebugAction['type'],
                        // 타입 변경 시 관련 파라미터 초기화
                        level: undefined,
                        value: undefined,
                        quantity: undefined,
                        seconds: undefined,
                        target: undefined,
                      })
                    }
                  >
                    <option value="reset">초기화</option>
                    <option value="setTier">티어 설정</option>
                    <option value="setMasteryScore">마스터리 점수 설정</option>
                    <option value="setMinerals">미네랄 설정</option>
                    <option value="setStamina">스태미나 설정</option>
                    <option value="grantAllItems">모든 아이템 지급</option>
                    <option value="grantAllBadges">모든 뱃지 지급</option>
                    <option value="setGameTime">게임 시간 설정</option>
                  </select>
                </div>

                {editingAction.type === 'reset' && (
                  <div className="custom-preset-modal-field">
                    <label
                      htmlFor="custom-preset-action-target-select"
                      className="custom-preset-modal-label"
                    >
                      대상:
                    </label>
                    <select
                      id="custom-preset-action-target-select"
                      name="actionTarget"
                      className="custom-preset-modal-select"
                      value={editingAction.target || 'all'}
                      onChange={(e) =>
                        setEditingAction({
                          ...editingAction,
                          target: e.target.value,
                        })
                      }
                    >
                      <option value="all">전체</option>
                      <option value="score">점수만</option>
                      <option value="minerals">미네랄만</option>
                      <option value="tier">티어만</option>
                    </select>
                  </div>
                )}

                {editingAction.type === 'setTier' && (
                  <div className="custom-preset-modal-field">
                    <label
                      htmlFor="custom-preset-action-level-input"
                      className="custom-preset-modal-label"
                    >
                      레벨:
                    </label>
                    <input
                      type="number"
                      id="custom-preset-action-level-input"
                      name="actionLevel"
                      className="custom-preset-modal-input"
                      value={editingAction.level ?? 0}
                      onChange={(e) =>
                        setEditingAction({
                          ...editingAction,
                          level: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      min="0"
                      max="6"
                    />
                  </div>
                )}

                {(editingAction.type === 'setMasteryScore' ||
                  editingAction.type === 'setMinerals' ||
                  editingAction.type === 'setStamina') && (
                  <div className="custom-preset-modal-field">
                    <label
                      htmlFor="custom-preset-action-value-input"
                      className="custom-preset-modal-label"
                    >
                      값:
                    </label>
                    <input
                      type="number"
                      id="custom-preset-action-value-input"
                      name="actionValue"
                      className="custom-preset-modal-input"
                      value={editingAction.value ?? 0}
                      onChange={(e) =>
                        setEditingAction({
                          ...editingAction,
                          value: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      min="0"
                    />
                  </div>
                )}

                {editingAction.type === 'grantAllItems' && (
                  <div className="custom-preset-modal-field">
                    <label
                      htmlFor="custom-preset-action-quantity-input"
                      className="custom-preset-modal-label"
                    >
                      수량:
                    </label>
                    <input
                      type="number"
                      id="custom-preset-action-quantity-input"
                      name="actionQuantity"
                      className="custom-preset-modal-input"
                      value={editingAction.quantity ?? 99}
                      onChange={(e) =>
                        setEditingAction({
                          ...editingAction,
                          quantity: parseInt(e.target.value, 10) || 99,
                        })
                      }
                      min="1"
                    />
                  </div>
                )}

                {editingAction.type === 'setGameTime' && (
                  <div className="custom-preset-modal-field">
                    <label
                      htmlFor="custom-preset-action-seconds-input"
                      className="custom-preset-modal-label"
                    >
                      초:
                    </label>
                    <input
                      type="number"
                      id="custom-preset-action-seconds-input"
                      name="actionSeconds"
                      className="custom-preset-modal-input"
                      value={editingAction.seconds ?? 5}
                      onChange={(e) =>
                        setEditingAction({
                          ...editingAction,
                          seconds: parseInt(e.target.value, 10) || 5,
                        })
                      }
                      min="1"
                    />
                  </div>
                )}

                <div className="custom-preset-modal-action-editor-buttons">
                  <button
                    className="custom-preset-modal-action-save-button"
                    onClick={handleSaveAction}
                  >
                    저장
                  </button>
                  <button
                    className="custom-preset-modal-action-cancel-button"
                    onClick={handleCancelAction}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="custom-preset-modal-footer">
          <button className="custom-preset-modal-save-button" onClick={handleSave}>
            저장
          </button>
          <button className="custom-preset-modal-cancel-button" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
