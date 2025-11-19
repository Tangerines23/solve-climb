import React, { FormEvent } from 'react';
import './CustomKeypad.css';

interface CustomKeypadProps {
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onBackspace?: () => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
  showNegative?: boolean; // 음수 버튼 표시 여부
}

export function CustomKeypad({
  onNumberClick,
  onClear,
  onBackspace,
  onSubmit,
  disabled = false,
  showNegative = false,
}: CustomKeypadProps) {
  const handleNumberClick = (num: string) => {
    if (!disabled) {
      // 진동 피드백은 부모 컴포넌트에서 처리
      onNumberClick(num);
    }
  };

  const handleBackspace = () => {
    if (!disabled && onBackspace) {
      onBackspace();
    }
  };

  return (
    <div className="custom-keypad">
      <div className="keypad-row">
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('1')}
          disabled={disabled}
        >
          1
        </button>
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('2')}
          disabled={disabled}
        >
          2
        </button>
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('3')}
          disabled={disabled}
        >
          3
        </button>
      </div>
      <div className="keypad-row">
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('4')}
          disabled={disabled}
        >
          4
        </button>
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('5')}
          disabled={disabled}
        >
          5
        </button>
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('6')}
          disabled={disabled}
        >
          6
        </button>
      </div>
      <div className="keypad-row">
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('7')}
          disabled={disabled}
        >
          7
        </button>
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('8')}
          disabled={disabled}
        >
          8
        </button>
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('9')}
          disabled={disabled}
        >
          9
        </button>
      </div>
      <div className="keypad-row keypad-row-last">
        {showNegative ? (
          <button
            className="keypad-key keypad-key-negative"
            onClick={() => {
              if (!disabled) {
                onNumberClick('-');
              }
            }}
            disabled={disabled}
          >
            ±
          </button>
        ) : (
          <button
            className="keypad-key keypad-key-backspace"
            onClick={handleBackspace}
            disabled={disabled}
          >
            ⌫
          </button>
        )}
        <button
          className="keypad-key"
          onClick={() => handleNumberClick('0')}
          disabled={disabled}
        >
          0
        </button>
        <button
          className="keypad-key keypad-key-submit"
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) {
              onSubmit(e);
            }
          }}
          disabled={disabled}
          type="button"
        >
          ✓
        </button>
      </div>
    </div>
  );
}

