import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CyclePromotionModal } from '../CyclePromotionModal';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('CyclePromotionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <CyclePromotionModal
        isOpen={false}
        stars={5}
        pendingScore={1000}
        onPromote={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <CyclePromotionModal
        isOpen={true}
        stars={5}
        pendingScore={1000}
        onPromote={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/전설 달성/)).toBeInTheDocument();
    expect(screen.getByText(/이월될 점수/)).toBeInTheDocument();
  });

  it('should call onPromote when promotion succeeds', async () => {
    const onPromote = vi.fn();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true },
      error: null,
    } as never);

    render(
      <CyclePromotionModal
        isOpen={true}
        stars={5}
        pendingScore={1000}
        onPromote={onPromote}
        onClose={vi.fn()}
      />
    );

    const promoteButton = screen.getByText('다음 도전 시작하기');
    promoteButton.click();

    await waitFor(() => {
      expect(onPromote).toHaveBeenCalled();
    });
  });

  it('should show error when promotion fails with error', async () => {
    const onPromote = vi.fn();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    } as never);

    render(
      <CyclePromotionModal
        isOpen={true}
        stars={5}
        pendingScore={1000}
        onPromote={onPromote}
        onClose={vi.fn()}
      />
    );

    const promoteButton = screen.getByText('다음 도전 시작하기');
    promoteButton.click();

    await waitFor(() => {
      expect(screen.getByText('승급 처리 중 오류가 발생했습니다.')).toBeInTheDocument();
    });

    expect(onPromote).not.toHaveBeenCalled();
  });

  it('should show error when promotion fails without success', async () => {
    const onPromote = vi.fn();
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: false, error: 'Promotion failed' },
      error: null,
    } as never);

    render(
      <CyclePromotionModal
        isOpen={true}
        stars={5}
        pendingScore={1000}
        onPromote={onPromote}
        onClose={vi.fn()}
      />
    );

    const promoteButton = screen.getByText('다음 도전 시작하기');
    promoteButton.click();

    await waitFor(() => {
      expect(screen.getByText('Promotion failed')).toBeInTheDocument();
    });

    expect(onPromote).not.toHaveBeenCalled();
  });

  it('should show loading state when promoting', async () => {
    const onPromote = vi.fn();
    let resolvePromotion: (value: any) => void;
    const promotionPromise = new Promise((resolve) => {
      resolvePromotion = resolve;
    });

    vi.mocked(supabase.rpc).mockReturnValue(promotionPromise as never);

    render(
      <CyclePromotionModal
        isOpen={true}
        stars={5}
        pendingScore={1000}
        onPromote={onPromote}
        onClose={vi.fn()}
      />
    );

    const promoteButton = screen.getByText('다음 도전 시작하기');
    promoteButton.click();

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromotion!({
      data: { success: true },
      error: null,
    });

    await waitFor(() => {
      expect(onPromote).toHaveBeenCalled();
    });
  });

  it('should disable buttons when promoting', async () => {
    const onClose = vi.fn();
    let resolvePromotion: (value: any) => void;
    const promotionPromise = new Promise((resolve) => {
      resolvePromotion = resolve;
    });

    vi.mocked(supabase.rpc).mockReturnValue(promotionPromise as never);

    render(
      <CyclePromotionModal
        isOpen={true}
        stars={5}
        pendingScore={1000}
        onPromote={vi.fn()}
        onClose={onClose}
      />
    );

    const promoteButton = screen.getByText('다음 도전 시작하기');
    const cancelButton = screen.getByText('나중에');
    
    promoteButton.click();

    // Buttons should be disabled during promotion
    await waitFor(() => {
      expect(promoteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    // Resolve the promise
    resolvePromotion!({
      data: { success: true },
      error: null,
    });
  });
});

