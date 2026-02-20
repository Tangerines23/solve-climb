import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('should display warning message and list items', () => {
    render(<DataResetConfirmModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/다음 데이터가 모두 삭제됩니다/)).toBeInTheDocument();
    expect(screen.getByText(/모든 게임 기록 및 진행도/)).toBeInTheDocument();
    expect(screen.getByText(/프로필 정보/)).toBeInTheDocument();
    expect(screen.getByText(/Supabase 데이터/)).toBeInTheDocument();
    expect(screen.getByText(/로컬 저장 데이터/)).toBeInTheDocument();
    expect(screen.getByText(/이 작업은 되돌릴 수 없습니다/)).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<DataResetConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />);

    const confirmButton = screen.getByText('초기화');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<DataResetConfirmModal isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should have correct button classes', () => {
    const { container: _container } = render(
      <DataResetConfirmModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    const cancelButton = screen.getByText('취소');
    const confirmButton = screen.getByText('초기화');

    expect(cancelButton).toHaveClass(
      'btn-base',
      'btn-secondary',
      'data-reset-confirm-modal-button'
    );
    expect(confirmButton).toHaveClass('btn-base', 'btn-danger', 'data-reset-confirm-modal-button');
  });

  it('should display warning icon in warning message', () => {
    render(<DataResetConfirmModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    const warningMessage = screen.getByText(/모든 데이터가 삭제됩니다/);
    expect(warningMessage).toBeInTheDocument();
    expect(warningMessage.textContent).toContain('⚠️');
  });
});
