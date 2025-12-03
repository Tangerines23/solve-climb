import React from 'react';
import { STAGE_CONFIG, type StageConfig } from '../constants/stages';
import './ModeSelectModal.css';

interface ModeSelectModalProps {
  isOpen: boolean;
  level: number;
  levelName: string;
  onClose: () => void;
  onSelectMode: (mode: 'time-attack' | 'survival') => void;
}

export function ModeSelectModal({
  isOpen,
  level,
  levelName,
  onClose,
  onSelectMode,
}: ModeSelectModalProps) {
  if (!isOpen) return null;

  // 현재 레벨의 스테이지 정보 찾기
  const stage: StageConfig = STAGE_CONFIG.find(
    (s) => level >= s.range[0] && level <= s.range[1]
  ) || STAGE_CONFIG[0];

  const handleModeSelect = (mode: 'time-attack' | 'survival') => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <div className="mode-select-modal-overlay" onClick={onClose}>
      <div className="mode-select-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mode-select-modal-header">
          <div className="mode-select-stage-info" style={{ color: stage.color }}>
            <span className="mode-select-stage-icon" role="img" aria-label={stage.title}>
              {stage.icon}
            </span>
            <span className="mode-select-stage-title">{stage.title}</span>
          </div>
          <h2 className="mode-select-modal-title">Level {level}: {levelName}</h2>
          <p className="mode-select-modal-subtitle" style={{ color: stage.color }}>
            {stage.desc}
          </p>
          <p className="mode-select-modal-subtitle-secondary">게임 모드를 선택하세요</p>
        </div>
        <div className="mode-select-modal-content">
          <button
            className="mode-select-button mode-select-button-time"
            onClick={() => handleModeSelect('time-attack')}
          >
            <span className="mode-select-icon">⏱️</span>
            <div className="mode-select-button-text">
              <div className="mode-select-button-title">타임 어택</div>
              <div className="mode-select-button-desc">60초간 최고 점수 도전</div>
            </div>
          </button>
          <button
            className="mode-select-button mode-select-button-survival"
            onClick={() => handleModeSelect('survival')}
          >
            <span className="mode-select-icon">♾️</span>
            <div className="mode-select-button-text">
              <div className="mode-select-button-title">서바이벌</div>
              <div className="mode-select-button-desc">틀릴 때까지 도전</div>
            </div>
          </button>
        </div>
        <button className="mode-select-modal-close" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}

