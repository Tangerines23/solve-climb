// 일본어 퀴즈용 텍스트 키보드
import React, { FormEvent } from 'react';
import './TextKeypad.css';

interface TextKeypadProps {
  onLetterClick: (letter: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
}

// 로마지 입력용 키보드 레이아웃
const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export function TextKeypad({
  onLetterClick,
  onClear,
  onBackspace,
  onSubmit,
  disabled = false,
}: TextKeypadProps) {
  const handleLetterClick = (letter: string) => {
    if (!disabled) {
      if (navigator.vibrate) navigator.vibrate(15);
      onLetterClick(letter);
    }
  };

  const handleClear = () => {
    if (!disabled) {
      if (navigator.vibrate) navigator.vibrate(15);
      onClear();
    }
  };

  const handleBackspace = () => {
    if (!disabled) {
      if (navigator.vibrate) navigator.vibrate(15);
      onBackspace();
    }
  };

  return (
    <div className="text-keypad">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="text-keypad-row">
          {row.map((letter) => (
            <button
              key={letter}
              className="text-keypad-key"
              onClick={() => handleLetterClick(letter)}
              disabled={disabled}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
      <div className="text-keypad-row text-keypad-row-last">
        <button
          className="text-keypad-key text-keypad-key-clear"
          onClick={handleClear}
          disabled={disabled}
        >
          C
        </button>
        <button
          className="text-keypad-key text-keypad-key-backspace"
          onClick={handleBackspace}
          disabled={disabled}
        >
          ⌫
        </button>
        <button
          className="text-keypad-key text-keypad-key-submit"
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

