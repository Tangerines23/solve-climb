import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnonymousDataWarningModal } from '../AnonymousDataWarningModal';

describe('AnonymousDataWarningModal', () => {
  it('should render warning content when open', () => {
    const mockClose = vi.fn();
    const mockGoToMyPage = vi.fn();

    render(
      <AnonymousDataWarningModal isOpen={true} onClose={mockClose} onGoToMyPage={mockGoToMyPage} />
    );

    expect(screen.getByText('⚠️ 데이터 유실 주의 안내')).toBeTruthy();
    expect(screen.getByText(/익명 임시 계정 이용 중/i)).toBeTruthy();
    expect(screen.getByText(/기기를 변경하거나 브라우저 캐시 삭제/i)).toBeTruthy();
  });

  it('should call onClose when clicking "나중에 하기"', () => {
    const mockClose = vi.fn();
    const mockGoToMyPage = vi.fn();

    render(
      <AnonymousDataWarningModal isOpen={true} onClose={mockClose} onGoToMyPage={mockGoToMyPage} />
    );

    fireEvent.click(screen.getByText('나중에 하기'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should call onGoToMyPage when clicking "3초 계정 연동하기"', () => {
    const mockClose = vi.fn();
    const mockGoToMyPage = vi.fn();

    render(
      <AnonymousDataWarningModal isOpen={true} onClose={mockClose} onGoToMyPage={mockGoToMyPage} />
    );

    fireEvent.click(screen.getByText('3초 계정 연동하기'));
    expect(mockGoToMyPage).toHaveBeenCalledTimes(1);
  });
});
