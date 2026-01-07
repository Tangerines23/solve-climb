import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataResetConfirmModal } from '../DataResetConfirmModal';

describe('DataResetConfirmModal', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <DataResetConfirmModal isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(<DataResetConfirmModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('데이터 초기화')).toBeInTheDocument();
    expect(screen.getByText(/모든 데이터가 삭제됩니다/)).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<DataResetConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />);

    const confirmButton = screen.getByText('초기화');
    confirmButton.click();

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<DataResetConfirmModal isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);

    const cancelButton = screen.getByText('취소');
    cancelButton.click();

    expect(onCancel).toHaveBeenCalled();
  });
});

