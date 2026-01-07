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
});

