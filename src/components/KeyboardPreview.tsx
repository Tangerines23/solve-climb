import React, { FormEvent } from 'react';
import { CustomKeypad } from './CustomKeypad';
import { QwertyKeypad } from './QwertyKeypad';

export type KeyboardDisplayType = 'qwerty-text' | 'qwerty-number' | 'custom';

export interface KeyboardPreviewProps {
  keyboardType: KeyboardDisplayType;
  allowNegative?: boolean;
  onKeyPress?: (key: string) => void;
  onClear?: () => void;
  onBackspace?: () => void;
  onSubmit?: (e: FormEvent) => void;
}

const NOOP = () => {};
const NOOP_SUBMIT = (e: FormEvent) => {
  e.preventDefault();
};

export const KeyboardPreview: React.FC<KeyboardPreviewProps> = ({
  keyboardType,
  allowNegative = false,
  onKeyPress = NOOP,
  onClear = NOOP,
  onBackspace = NOOP,
  onSubmit = NOOP_SUBMIT,
}) => {
  if (keyboardType === 'custom') {
    return (
      <CustomKeypad
        onNumberClick={onKeyPress}
        onClear={onClear}
        onBackspace={onBackspace}
        onSubmit={onSubmit}
        disabled={false}
        showNegative={allowNegative}
      />
    );
  }

  if (keyboardType === 'qwerty-text') {
    return (
      <QwertyKeypad
        onKeyPress={onKeyPress}
        onClear={onClear}
        onBackspace={onBackspace}
        onSubmit={onSubmit}
        disabled={false}
        mode="text"
      />
    );
  }

  return (
    <QwertyKeypad
      onKeyPress={onKeyPress}
      onClear={onClear}
      onBackspace={onBackspace}
      onSubmit={onSubmit}
      disabled={false}
      mode="number"
      allowNegative={allowNegative}
    />
  );
};
