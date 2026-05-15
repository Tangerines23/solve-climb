// 범용 쿼티 키보드 (수학 및 일본어 퀴즈 모두 지원)
import React, { FormEvent, useEffect, useRef } from 'react';
import { useQwertyKeypadBridge } from '../../hooks/bridge/useQwertyKeypadBridge';
import './QwertyKeypad.css';

interface QwertyKeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
  mode?: 'text' | 'number'; // 'text': 영문자, 'number': 숫자만
  allowNegative?: boolean; // 음수 허용 (number 모드에서만)
}

// 쿼티 키보드 레이아웃
const QWERTY_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

// 숫자 키보드 레이아웃 (쿼티 스타일 - 가로로 배치)
const NUMBER_LAYOUT = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']];

function QwertyKeypadComponent({
  onKeyPress,
  onClear,
  onBackspace,
  onSubmit,
  disabled = false,
  mode = 'text',
  allowNegative = false,
}: QwertyKeypadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { vibrate } = useQwertyKeypadBridge();

  // PC 키보드 입력 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // 입력 필드나 textarea에 포커스가 있으면 무시 (중복 입력 방지)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Enter 키: 제출
      if (key === 'enter') {
        e.preventDefault();
        const fakeEvent = { preventDefault: () => {} } as FormEvent;
        onSubmit(fakeEvent);
        return;
      }

      // Backspace 키: 백스페이스
      if (key === 'backspace') {
        e.preventDefault();
        onBackspace();
        return;
      }

      // Escape 또는 Delete 키: 지우기
      if (key === 'escape' || key === 'delete') {
        e.preventDefault();
        onClear();
        return;
      }

      if (mode === 'number') {
        // 숫자 모드: 숫자와 음수 기호만 허용
        if (key >= '0' && key <= '9') {
          e.preventDefault();
          onKeyPress(key);
        } else if (allowNegative && key === '-') {
          e.preventDefault();
          onKeyPress('-');
        }
      } else {
        // 텍스트 모드: 영문자만 허용
        if (key.length === 1 && /[a-z]/.test(key)) {
          e.preventDefault();
          onKeyPress(key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, mode, allowNegative, onKeyPress, onClear, onBackspace, onSubmit]);

  const handleKeyClick = (key: string) => {
    if (!disabled) {
      vibrate();
      onKeyPress(key);
    }
  };

  const handleBackspace = () => {
    if (!disabled) {
      vibrate();
      onBackspace();
    }
  };

  const layout = mode === 'number' ? NUMBER_LAYOUT : QWERTY_LAYOUT;

  return (
    <div
      ref={containerRef}
      className={`qwerty-keypad ${mode === 'number' ? 'qwerty-keypad-number' : ''}`}
      data-mode={mode}
      data-vg-ignore="true"
    >
      {layout.map((row, rowIndex) => (
        <div key={rowIndex} className="qwerty-keypad-row">
          {row.map((key) => (
            <button
              key={key}
              className="qwerty-keypad-key"
              onClick={() => handleKeyClick(key)}
              disabled={disabled}
            >
              {key}
            </button>
          ))}
          {/* 두 번째 줄 끝에 Backspace (L 옆) */}
          {rowIndex === 1 && (
            <button
              className="qwerty-keypad-key qwerty-keypad-key-backspace"
              onClick={handleBackspace}
              disabled={disabled}
            >
              ⌫
            </button>
          )}
          {/* 세 번째 줄 끝에 Enter(확인) (M 옆) */}
          {rowIndex === 2 && (
            <button
              className="qwerty-keypad-key qwerty-keypad-key-submit"
              onClick={(e) => {
                e.preventDefault();
                if (!disabled) {
                  vibrate();
                  onSubmit(e);
                }
              }}
              disabled={disabled}
              type="button"
            >
              ✓
            </button>
          )}
        </div>
      ))}
      {/* 숫자 모드일 때만 하단 줄에 음수 버튼 표시 */}
      {mode === 'number' && allowNegative && (
        <div className="qwerty-keypad-row qwerty-keypad-row-last">
          <button
            className="qwerty-keypad-key qwerty-keypad-key-negative"
            onClick={() => handleKeyClick('-')}
            disabled={disabled}
          >
            ±
          </button>
        </div>
      )}
    </div>
  );
}

// React.memo로 메모이제이션
export const QwertyKeypad = React.memo(QwertyKeypadComponent);
