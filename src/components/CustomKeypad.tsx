import React, { FormEvent } from 'react';
import { vibrateShort } from '../utils/haptic';
import { useSettingsStore } from '../stores/useSettingsStore';
import { KEYPAD_SYMBOLS } from '../constants/ui';
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

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

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

  const handleAction = (action: () => void) => {
    if (!disabled) {
      if (hapticEnabled) vibrateShort();
      action();
    }
  };

  const handleNumberClick = (num: string) => handleAction(() => onNumberClick(num));
  const handleBackspace = () => onBackspace && handleAction(onBackspace);
  const handleSubmit = (e: FormEvent) => handleAction(() => onSubmit(e));

  const renderSpecialKey = () => {
    if (!showNegative && !showDecimal && !showFraction) return null;

    const label = showDecimal
      ? KEYPAD_SYMBOLS.DECIMAL
      : showFraction
        ? KEYPAD_SYMBOLS.FRACTION
        : KEYPAD_SYMBOLS.NEGATIVE;
    const value = showDecimal
      ? KEYPAD_SYMBOLS.DECIMAL
      : showFraction
        ? KEYPAD_SYMBOLS.FRACTION
        : '-';

    return (
      <button
        className="keypad-key keypad-key-special"
        onClick={() => handleNumberClick(value)}
        disabled={disabled}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="custom-keypad" data-vg-ignore="true">
      {KEY_ROWS.map((row, idx) => (
        <div key={`row-${idx}`} className="keypad-row">
          {row.map((num) => (
            <button
              key={num}
              className="keypad-key"
              onClick={() => handleNumberClick(num)}
              disabled={disabled}
            >
              {num}
            </button>
          ))}
        </div>
      ))}

      <div
        className={`keypad-row keypad-row-last ${showNegative || showDecimal || showFraction ? 'keypad-row-last-with-special' : ''}`}
      >
        {renderSpecialKey() || (
          <div className="keypad-key-placeholder" style={{ flex: 1, visibility: 'hidden' }} />
        )}

        <button className="keypad-key" onClick={() => handleNumberClick('0')} disabled={disabled}>
          0
        </button>

        <button
          className="keypad-key keypad-key-backspace"
          onClick={handleBackspace}
          disabled={disabled}
        >
          {KEYPAD_SYMBOLS.BACKSPACE}
        </button>

        <button
          className="btn-base btn-primary keypad-key keypad-key-submit"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          disabled={disabled}
          type="button"
        >
          {KEYPAD_SYMBOLS.SUBMIT}
        </button>
      </div>
    </div>
  );
}

// React.memo로 메모이제이션
export const CustomKeypad = React.memo(CustomKeypadComponent);
