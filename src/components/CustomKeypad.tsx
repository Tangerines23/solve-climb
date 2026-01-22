import React, { FormEvent } from 'react';
import { vibrateShort } from '../utils/haptic';
import { useSettingsStore } from '../stores/useSettingsStore';
import './CustomKeypad.css';

interface CustomKeypadProps {
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onBackspace?: () => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
  showNegative?: boolean; // 음수 버튼 표시 여부
  showDecimal?: boolean; // 소수점 버튼 표시 여부
  showFraction?: boolean; // 분수 버튼 표시 여부
}

function CustomKeypadComponent({
  onNumberClick,
  onClear: _onClear,
  onBackspace,
  onSubmit,
  disabled = false,
  showNegative = false,
  showDecimal = false,
  showFraction = false,
}: CustomKeypadProps) {
  // Zustand Selector 패턴 적용
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);

  const handleNumberClick = (num: string) => {
    if (!disabled) {
      if (hapticEnabled) {
        vibrateShort();
      }
      onNumberClick(num);
    }
  };

  const handleBackspace = () => {
    if (!disabled && onBackspace) {
      if (hapticEnabled) {
        vibrateShort();
      }
      onBackspace();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (!disabled) {
      if (hapticEnabled) {
        vibrateShort();
      }
      onSubmit(e);
    }
  };

  return (
    <div className="custom-keypad">
      <div className="keypad-row">
        <button className="keypad-key" onClick={() => handleNumberClick('1')} disabled={disabled}>
          1
        </button>
        <button className="keypad-key" onClick={() => handleNumberClick('2')} disabled={disabled}>
          2
        </button>
        <button className="keypad-key" onClick={() => handleNumberClick('3')} disabled={disabled}>
          3
        </button>
      </div>
      <div className="keypad-row">
        <button className="keypad-key" onClick={() => handleNumberClick('4')} disabled={disabled}>
          4
        </button>
        <button className="keypad-key" onClick={() => handleNumberClick('5')} disabled={disabled}>
          5
        </button>
        <button className="keypad-key" onClick={() => handleNumberClick('6')} disabled={disabled}>
          6
        </button>
      </div>
      <div className="keypad-row">
        <button className="keypad-key" onClick={() => handleNumberClick('7')} disabled={disabled}>
          7
        </button>
        <button className="keypad-key" onClick={() => handleNumberClick('8')} disabled={disabled}>
          8
        </button>
        <button className="keypad-key" onClick={() => handleNumberClick('9')} disabled={disabled}>
          9
        </button>
      </div>
      <div
        className={`keypad-row keypad-row-last ${showNegative || showDecimal || showFraction ? 'keypad-row-last-with-negative' : ''}`}
      >
        {showNegative || showDecimal || showFraction ? (
          <>
            <button
              className="keypad-key keypad-key-special"
              onClick={() => {
                if (!disabled) {
                  if (showDecimal) handleNumberClick('.');
                  else if (showFraction) handleNumberClick('/');
                  else if (showNegative) handleNumberClick('-');
                }
              }}
              disabled={disabled}
            >
              {showDecimal ? '.' : showFraction ? '/' : '±'}
            </button>
            <button
              className="keypad-key keypad-key-backspace"
              onClick={handleBackspace}
              disabled={disabled}
            >
              ⌫
            </button>
          </>
        ) : (
          <button
            className="keypad-key keypad-key-backspace"
            onClick={handleBackspace}
            disabled={disabled}
          >
            ⌫
          </button>
        )}
        <button className="keypad-key" onClick={() => handleNumberClick('0')} disabled={disabled}>
          0
        </button>
        <button
          className="keypad-key keypad-key-submit"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e);
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

// React.memo로 메모이제이션
export const CustomKeypad = React.memo(CustomKeypadComponent);
