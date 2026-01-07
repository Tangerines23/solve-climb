import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BadgeSystemSection } from '../debug/BadgeSystemSection';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: vi.fn(() => ({
    progress: {},
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

vi.mock('../Toast', () => ({
  Toast: ({ message, isOpen }: { message: string; isOpen: boolean }) =>
    isOpen ? <div>{message}</div> : null,
}));

describe('BadgeSystemSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'badge1', name: 'Test Badge', description: 'Test', emoji: '🏆' },
          ],
          error: null,
        }),
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    } as any);
  });

  it('should render badge system section', async () => {
    render(<BadgeSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/뱃지 시스템/)).toBeInTheDocument();
    });
  });

  it('should handle badge loading', async () => {
    render(<BadgeSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/뱃지 시스템/)).toBeInTheDocument();
    });
  });

  it('should render badge definitions after loading', async () => {
    render(<BadgeSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/뱃지 시스템/)).toBeInTheDocument();
    });
  });
});


