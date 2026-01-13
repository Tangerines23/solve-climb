import { useState } from 'react';
// import { createSafeStorageKey } from '../utils/storageKey'; // Removed
// import { storage } from '../utils/storage'; // Removed
import { BackpackBottomSheet } from './game/BackpackBottomSheet';
import './GameTipModal.css';

interface GameTipModalProps {
  isOpen: boolean;
  category: string;
  subTopic: string;
  level?: number | null;
  onClose: () => void;
  onStart: (selectedItemIds: number[]) => void;
}

export function GameTipModal({ isOpen, category, subTopic, level, onStart }: GameTipModalProps) {
  // const [dontShowAgain, setDontShowAgain] = useState(false); // Removed
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
    if (category === 'math' && (subTopic === 'arithmetic' || subTopic === 'equations')) {
      const isArithmetic = subTopic === 'arithmetic';
      const title = isArithmetic ? '사칙연산 팁' : '방정식 풀이 팁';
      const icon = isArithmetic ? '🧮' : '🧩';
      const description = isArithmetic
        ? '핵심 로직: "숫자를 쪼개거나(Split), 10을 만들어라(Make 10)."'
        : '핵심 로직: "이항(Transposition) = 부호 반대(Change Sign)."';

      if (!level) return { title, icon, description, section: null, other: null };

      // Simplified tips for brevity in this tool call, normally would have the full set
      const tips: Record<
        string,
        { title: string; tip: string; example: string; strategy: string }
      > = isArithmetic
        ? {
            1: {
              title: '1레벨: 반사신경 덧셈',
              tip: '계산 금지. 이미지를 떠올리세요.',
              example: '3+4=?',
              strategy: '숫자를 보자마자 구구단 외우듯 답을 찍으세요.',
            },
            2: {
              title: '2레벨: 뺄셈의 기본',
              tip: '덧셈의 반대! 채워넣기를 하세요.',
              example: '9-5=?',
              strategy: '5에 무엇을 더해야 9가 될지 생각해보세요.',
            },
            3: {
              title: '3레벨: 10 만들기 (Make 10)',
              tip: '두 숫자를 합쳐 10을 먼저 만세요.',
              example: '8+5=?',
              strategy: '8에게 2를 빌려줘서 10을 만들고, 남은 3을 더하세요. (13)',
            },
            4: {
              title: '4레벨: 받아내림 뺄셈',
              tip: '10을 빌려와서 뻬세요.',
              example: '15-7=?',
              strategy: '10에서 7을 먼저 빼면 3, 거기에 5를 더하세요.',
            },
            5: {
              title: '5레벨: 구구단 (곱셈)',
              tip: '구구단을 노래처럼 외우세요.',
              example: '7x8=?',
              strategy: '7, 14, 21... 손가락 세지 말고 바로 튀어나와야 합니다!',
            },
            6: {
              title: '6레벨: 나눗셈 (역연산)',
              tip: '곱셈을 거꾸로 생각하세요.',
              example: '42÷6=?',
              strategy: '6단에서 무엇을 곱해야 42가 나오나요? 정답은 7!',
            },
            7: {
              title: '7레벨: 혼합 계산 1',
              tip: '곱셈/나눗셈 먼저! 괄호 먼저!',
              example: '3+5x2=?',
              strategy: '5x2=10을 먼저 하고 3을 더하세요. 순서가 생명입니다.',
            },
            8: {
              title: '8레벨: 두 자리 곱셈',
              tip: '분배 법칙: 쪼개서 곱하세요.',
              example: '12x4=?',
              strategy: '10x4=40, 2x4=8. 합치면 48! 머릿속으로 쪼개세요.',
            },
            9: {
              title: '9레벨: 나머지 있는 나눗셈',
              tip: '가장 가까운 구구단을 찾으세요.',
              example: '50÷7=?',
              strategy: '7x7=49. 50에서 49를 빼면 1. 몫은 7, 나머지는 1.',
            },
            10: {
              title: '10레벨: 사칙연산 마스터',
              tip: '침착함이 무기입니다.',
              example: '(3+7)x5-4=?',
              strategy: '괄호(10) → 곱하기(50) → 빼기(4). 흐름을 타세요!',
            },
          }
        : {
            1: {
              title: '1레벨: 직관 방정식',
              tip: '더해서 나왔으니 → 뺀다',
              example: '□+3=8',
              strategy: '결과값(8)에서 더해진 숫자(3)를 덜어내세요. 정답 5.',
            },
            2: {
              title: '2레벨: 뺄셈 방정식',
              tip: '빠진 조각 찾기',
              example: '10-□=4',
              strategy: '10에서 4를 빼보세요. 둘은 자리를 바꿀 수 있습니다.',
            },
            3: {
              title: '3레벨: 이항 (Transposition)',
              tip: '이사 가면 부호가 바뀝니다.',
              example: '2x+1=5',
              strategy: '+1이 넘어가면 -1이 됩니다. 2x=4, x=2!',
            },
            4: {
              title: '4레벨: 곱셈/나눗셈 역연산',
              tip: '곱하기는 나누기로 부수세요.',
              example: '3x=21',
              strategy: '양쪽을 3으로 나누세요. x=7.',
            },
            5: {
              title: '5레벨: 복합 방정식',
              tip: '덧셈/뺄셈부터 정리하세요.',
              example: '2x-4=6',
              strategy: '-4를 먼저 넘겨서 +4로 만드세요. 2x=10.',
            },
            6: {
              title: '6레벨: 괄호 방정식',
              tip: '분배법칙으로 괄호를 푸세요.',
              example: '2(x+1)=8',
              strategy: '2x+2=8로 만들기. 또는 양변을 2로 나누기.',
            },
            7: {
              title: '7레벨: 분수 방정식',
              tip: '분모를 없애는 게 빠릅니다.',
              example: 'x/2 + 1 = 3',
              strategy: '모든 항에 2를 곱해버리세요! x + 2 = 6.',
            },
            8: {
              title: '8레벨: 양변에 미지수',
              tip: '끼리끼리 모으세요.',
              example: '2x+1 = x+5',
              strategy: 'x는 왼쪽으로, 숫자는 오른쪽으로 이사!',
            },
            9: {
              title: '9레벨: 소수점이 있는 방정식',
              tip: '10을 곱해서 정수로 만드세요.',
              example: '0.2x = 1',
              strategy: '양변에 10을 곱하면 2x=10. 훨씬 쉽죠?',
            },
            10: {
              title: '10레벨: 방정식 마스터',
              tip: '검산하는 습관을 들이세요.',
              example: '복잡한 식',
              strategy: '구한 답을 원래 식에 넣어보세요. 맞다면 그게 정답!',
            },
          };

      const levelTip = tips[level || 1] || tips[1]; // Fallback if level is null or out of range

      const section = (
        <div className="level-tip-card">
          <h4 className="level-tip-title">{levelTip.title}</h4>
          <p className="level-tip-text">
            <strong>팁:</strong> {levelTip.tip}
          </p>
          {levelTip.strategy && (
            <p className="level-tip-strategy">
              <strong>공략:</strong> {levelTip.strategy}
            </p>
          )}
          <div className="level-tip-example">
            <span>예시: {levelTip.example}</span>
          </div>
        </div>
      );

      return { title, icon, description, section, other: null };
    }

    if (category === 'language' && subTopic === 'japanese') {
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
    <div className="gt-modal-overlay">
      <div className="gt-modal-content">
        <div className="gt-layout-wrapper">
          {/* Left Side: Title & Controls */}
          <div className="gt-left-panel">
            <div className="gt-title-area">
              <span className="gt-title-icon">{tipData.icon}</span>
              <h3 className="gt-title-text">{tipData.title}</h3>
            </div>

            <div className="gt-controls-area">
              <div
                className="gt-checkbox-label"
                onClick={() => window.history.back()}
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                <span>← 뒤로</span>
              </div>

              <div className="gt-button-group">
                <button className="gt-start-btn" onClick={() => onStart(selectedItemIds)}>
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
      </div>

      <BackpackBottomSheet
        isOpen={isBackpackOpen}
        onClose={() => setIsBackpackOpen(false)}
        selectedItemIds={selectedItemIds}
        onToggleItem={toggleItem}
      />
    </div>
  );
}
