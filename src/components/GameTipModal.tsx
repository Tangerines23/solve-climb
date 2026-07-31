import { useState } from 'react';
import { BackpackBottomSheet } from './game/BackpackBottomSheet';
import { BaseModal } from './BaseModal';
import { GeometryTipVisualizer } from './geometry/GeometryTipVisualizer';
import { WORLD_TIPS, CATEGORY_TIPS, type TipItem } from '../constants/tips';
import './GameTipModal.css';

interface GameTipModalProps {
  isOpen: boolean;
  category: string;
  subTopic: string;
  level?: number | null;
  onClose: () => void;
  onStart: (selectedItemIds: number[]) => void;
}

export function GameTipModal({
  isOpen,
  category,
  subTopic,
  level,
  onStart,
  onClose,
}: GameTipModalProps) {
  // const [doNotShowAgain, setDoNotShowAgain] = useState(false); // Removed
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  if (!isOpen) {
    return null;
  }

  // start handler removed, using inline onStart

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const getTipData = () => {
    // Math Mountain Tips
    if (category === '기초' || category === '대수' || category === '논리' || category === '심화') {
      let title = '게임 팁';
      let icon = '💡';
      let description = '문제를 빠르고 정확하게 풀어보세요!';
      let tips: Record<number, TipItem> = {};

      if (category === '기초') {
        if (subTopic === 'World2') {
          title = '도형과 공간 팁';
          icon = '📐';
          description = '공식과 대칭 규칙을 활용하세요.';
          tips = WORLD_TIPS.World2 || {};
        } else if (subTopic === 'World3') {
          title = '확률과 통계 팁';
          icon = '📊';
          description = '평균과 경우의 수 규칙을 활용하세요.';
          tips = WORLD_TIPS.World3 || {};
        } else if (subTopic === 'World4') {
          title = '공학 및 응용 팁';
          icon = '💻';
          description =
            '2진수(비트)에서 출발하여 논리 게이트, 메모리 단위, 자료구조, 보수 연산과 CPU 계산의 흐름을 이해하세요.';
          tips = WORLD_TIPS.World4 || {};
        } else {
          title = '사칙연산 팁';
          icon = '🧮';
          description = '핵심 로직: "숫자를 쪼개거나(Split), 10을 만들어라(Make 10)."';
          tips = WORLD_TIPS.World1 || {};
        }
      } else if (category === '대수') {
        title = '방정식 풀이 팁';
        icon = '🧩';
        description = '핵심 로직: "이항(Transposition) = 부호 반대(Change Sign)."';
        tips = CATEGORY_TIPS.대수 || {};
      } else if (category === '논리') {
        title = '논리 수학 팁';
        icon = '🧠';
        description = '핵심 로직: "패턴을 찾고 규칙을 적용하세요."';
        tips = CATEGORY_TIPS.논리 || {};
      } else if (category === '심화') {
        title = '고급 수학 팁';
        icon = '📈';
        description = '핵심 로직: "함수의 변화와 기울기를 이해하세요."';
        tips = CATEGORY_TIPS.심화 || {};
      }

      const levelTip = tips[level || 1] || tips[1]; // Fallback if level is null or out of range

      if (!level) return { title, icon, description, section: null, other: null };

      const section = (
        <div className="level-tip-card" data-vg-ignore="true">
          <h4 className="level-tip-title">{levelTip.title}</h4>
          {subTopic === 'World2' && <GeometryTipVisualizer level={level || 1} />}
          <p className="level-tip-text" data-vg-ignore="true">
            <strong>팁:</strong> {levelTip.tip}
          </p>
          {levelTip.strategy && (
            <p className="level-tip-strategy" data-vg-ignore="true">
              <strong>공략:</strong> {levelTip.strategy}
            </p>
          )}
          <div className="level-tip-example" data-vg-ignore="true">
            <span>예시: {levelTip.example}</span>
          </div>
        </div>
      );

      return { title, icon, description, section, other: null };
    }

    if (category === '히라가나') {
      // Japanese tips...
      return {
        title: '히라가나 표',
        icon: '💡',
        description: '히라가나를 보고 로마지(영문자)로 입력하세요.',
        section: null,
        other: <div className="hiragana-mini-table">...</div>,
      };
    }

    return {
      title: '게임 팁',
      icon: '💡',
      description: '문제를 빠르고 정확하게 풀어보세요!',
      section: null,
      other: null,
    };
  };

  const tipData = getTipData();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showOverlay={true}
      closeOnOverlayClick={true}
      title={null} // Custom layout used inside children
      className="gt-modal-container"
    >
      <div className="gt-layout-wrapper">
        {/* Left Side: Title & Controls */}
        <div className="gt-left-panel">
          <div className="gt-title-area">
            <span className="gt-title-icon">{tipData.icon}</span>
            <h3 className="gt-title-text" data-testid="gt-title-text">
              {tipData.title}
            </h3>
          </div>

          <div className="gt-controls-area" data-vg-ignore="true">
            <div
              className="gt-checkbox-label"
              onClick={onClose}
              style={{ cursor: 'pointer', display: 'inline-flex' }}
            >
              <span>← 뒤로</span>
            </div>

            <div className="gt-button-group" data-vg-ignore="true">
              <button
                className="btn-base btn-primary gt-start-btn"
                data-testid="gt-start-btn"
                onClick={() => onStart(selectedItemIds)}
                data-vg-ignore="true"
              >
                시작하기
              </button>
              <button className="gt-backpack-btn" onClick={() => setIsBackpackOpen(true)}>
                🎒
                {selectedItemIds.length > 0 && (
                  <span className="gt-badge">{selectedItemIds.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Tip Content */}
        <div className="gt-right-panel">
          <div className="gt-description">{tipData.description}</div>
          <div className="gt-scroll-content">
            {tipData.section}
            {tipData.other}
          </div>
        </div>
      </div>

      <BackpackBottomSheet
        isOpen={isBackpackOpen}
        onClose={() => setIsBackpackOpen(false)}
        selectedItemIds={selectedItemIds}
        onToggleItem={toggleItem}
      />
    </BaseModal>
  );
}
