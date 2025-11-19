// 프로필 삭제 확인 모달 (닉네임 및 비밀번호 입력 필요)
import React, { useState } from 'react';
import './DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  nickname: string;
  isAdmin: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  nickname,
  isAdmin,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [inputNickname, setInputNickname] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 모달이 닫힐 때 입력값 초기화 (Hooks는 항상 같은 순서로 호출되어야 함)
  React.useEffect(() => {
    if (!isOpen) {
      setInputNickname('');
      setInputPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // 닉네임 확인
    if (inputNickname.trim() !== nickname) {
      setError('닉네임이 일치하지 않습니다.');
      return;
    }

    // admin인 경우 비밀번호 확인
    if (isAdmin) {
      if (inputPassword !== '1234') {
        setError('비밀번호가 올바르지 않습니다.');
        return;
      }
    }

    // 모든 검증 통과 - 입력값 초기화 후 확인
    setInputNickname('');
    setInputPassword('');
    setError('');
    onConfirm();
  };

  const handleCancel = () => {
    // 취소 시 입력값 초기화
    setInputNickname('');
    setInputPassword('');
    setError('');
    onCancel();
  };

  const isFormValid = () => {
    if (inputNickname.trim() !== nickname) return false;
    if (isAdmin && inputPassword !== '1234') return false;
    return true;
  };

  return (
    <div className="delete-confirm-modal-overlay" onClick={handleCancel}>
      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-confirm-modal-header">
          <h2 className="delete-confirm-modal-title">프로필 삭제</h2>
          <p className="delete-confirm-modal-warning">
            ⚠️ 이 작업은 되돌릴 수 없습니다
          </p>
        </div>
        <div className="delete-confirm-modal-content">
          <p className="delete-confirm-modal-message">
            프로필을 삭제하려면 다음 정보를 입력해주세요:
          </p>
          
          <div className="delete-confirm-form">
            <div className="delete-confirm-field">
              <label className="delete-confirm-label">
                닉네임 입력
              </label>
              <input
                type="text"
                value={inputNickname}
                onChange={(e) => {
                  setInputNickname(e.target.value);
                  setError('');
                }}
                placeholder={`"${nickname}" 입력`}
                className={`delete-confirm-input ${error && inputNickname.trim() !== nickname ? 'error' : ''}`}
                autoFocus
              />
            </div>

            {isAdmin && (
              <div className="delete-confirm-field">
                <label className="delete-confirm-label">
                  비밀번호 입력
                </label>
                <div className="delete-confirm-password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="비밀번호 입력"
                    className={`delete-confirm-input ${error && inputPassword !== '1234' ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="delete-confirm-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="delete-confirm-error">{error}</p>
            )}
          </div>
        </div>
        <div className="delete-confirm-modal-actions">
          <button
            className="delete-confirm-modal-button delete-confirm-modal-button-cancel"
            onClick={handleCancel}
          >
            취소
          </button>
          <button
            className="delete-confirm-modal-button delete-confirm-modal-button-confirm delete-confirm-modal-button-danger"
            onClick={handleConfirm}
            disabled={!isFormValid()}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

