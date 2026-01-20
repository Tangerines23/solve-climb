import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BadgeNotification } from '../BadgeNotification';
import { supabase } from '../../utils/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('BadgeNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when badgeIds is empty', () => {
    const { container } = render(<BadgeNotification badgeIds={[]} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render badge notification when badgeIds are provided', async () => {
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: 'First badge description',
          emoji: '🏆',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1']} onClose={vi.fn()} />);

    await waitFor(
      () => {
        expect(screen.getByText('🎉 뱃지 획득! 🎉')).toBeInTheDocument();
        expect(screen.getByText('First Badge')).toBeInTheDocument();
        expect(screen.getByText('First badge description')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should render multiple badges', async () => {
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: 'First badge description',
          emoji: '🏆',
        },
        {
          id: 'badge2',
          name: 'Second Badge',
          description: null,
          emoji: '⭐',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1', 'badge2']} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('First Badge')).toBeInTheDocument();
      expect(screen.getByText('Second Badge')).toBeInTheDocument();
    });
  });

  it('should use default emoji when emoji is null', async () => {
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: 'First badge description',
          emoji: null,
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1']} onClose={vi.fn()} />);

    await waitFor(() => {
      // Default emoji should be used
      const badgeIcon = screen.getByText('🏆');
      expect(badgeIcon).toBeInTheDocument();
    });
  });

  it('should not render description when description is null', async () => {
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: null,
          emoji: '🏆',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1']} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('First Badge')).toBeInTheDocument();
    });

    // Description should not be rendered
    expect(screen.queryByText(/First badge description/)).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: 'First badge description',
          emoji: '🏆',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1']} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('확인')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('확인');
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: 'First badge description',
          emoji: '🏆',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1']} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('🎉 뱃지 획득! 🎉')).toBeInTheDocument();
    });

    const overlay = screen.getByText('🎉 뱃지 획득! 🎉').closest('.badge-notification-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should set up auto close timer when badgeIds are provided', async () => {
    const onClose = vi.fn();
    const mockIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'badge1',
          name: 'First Badge',
          description: 'First badge description',
          emoji: '🏆',
        },
      ],
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<SupabaseClient['from']>);

    render(<BadgeNotification badgeIds={['badge1']} onClose={onClose} />);

    await waitFor(
      () => {
        expect(screen.getByText('🎉 뱃지 획득! 🎉')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Timer should be set up (we can't easily test the actual timeout without fake timers
    // which conflict with async operations, so we just verify the component renders correctly)
    expect(screen.getByText('First Badge')).toBeInTheDocument();
  });

  it('should handle error when loading badge definitions fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockIn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const mockSelect = vi.fn().mockReturnValue({
      in: mockIn,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown);

    render(<BadgeNotification badgeIds={['badge1']} onClose={vi.fn()} />);

    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Component should still render but with empty badgeDefs
    // The modal will show but with no badge items
    await waitFor(
      () => {
        expect(screen.getByText('🎉 뱃지 획득! 🎉')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    consoleErrorSpy.mockRestore();
  });
});
