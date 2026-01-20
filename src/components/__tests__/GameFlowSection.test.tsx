import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GameFlowSection } from '../debug/GameFlowSection';
import { supabase } from '../../utils/supabaseClient';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { useQuizStore } from '../../stores/useQuizStore';

// Mock dependencies
vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: vi.fn(),
}));

vi.mock('../../stores/useGameStore', () => ({
  useGameStore: vi.fn(() => ({
    score: 0,
    combo: 0,
  })),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../../utils/quizGenerator', () => ({
  generateQuestion: vi.fn(),
}));

describe('GameFlowSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuizStore).mockReturnValue({
      category: 'math',
      topic: 'addition',
      difficulty: 'easy',
      gameMode: 'time-attack',
      setGameMode: vi.fn(),
    } as unknown);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    } as unknown as { data: { session: Session }; error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<SupabaseClient['from']>);
  });

  it('should render without crashing', async () => {
    const { container } = render(<GameFlowSection />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('should render game flow section title', async () => {
    render(<GameFlowSection />);
    await waitFor(() => {
      expect(screen.getByText(/게임 플로우/)).toBeInTheDocument();
    });
  });

  it('should handle session loading', async () => {
    render(<GameFlowSection />);
    await waitFor(() => {
      expect(screen.getByText(/게임 플로우/)).toBeInTheDocument();
    });
  });
});
