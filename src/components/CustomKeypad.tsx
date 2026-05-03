import React, { FormEvent } from 'react';
import { useHaptic } from '../hooks/useHaptic';
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
  const { vibrateShort } = useHaptic();
  // Zustand Selector 패턴 적용
  const handleAction = (action: () => void) => {
    if (!disabled) {
      vibrateShort();
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
      {/* 1 ~ 9 */}
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
        <button
          key={num}
          className="keypad-key"
          onClick={() => handleNumberClick(num)}
          disabled={disabled}
        >
          {num}
        </button>
      ))}

      {/* 특수키(., -, /) 표시될 때만 렌더링 */}
      {renderSpecialKey()}

      {/* 0 (특수키가 없으면 2칸 차지하여 빈공간 메꿈) */}
      <button
        className={`keypad-key ${!renderSpecialKey() ? 'keypad-key-zero-wide' : ''}`}
        onClick={() => handleNumberClick('0')}
        disabled={disabled}
      >
        0
      </button>

      {/* 지우기 */}
      <button
        className="keypad-key keypad-key-backspace"
        onClick={handleBackspace}
        disabled={disabled}
      >
        {KEYPAD_SYMBOLS.BACKSPACE}
      </button>

      {/* 확인 (3열 차지) */}
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
  );
}

// React.memo로 메모이제이션
export const CustomKeypad = React.memo(CustomKeypadComponent);
