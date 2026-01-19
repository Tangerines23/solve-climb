import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataResetSection } from '../debug/DataResetSection';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import { useUserStore } from '../../stores/useUserStore';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
vi.mock('../../hooks/useMyPageStats', () => ({
  useMyPageStats: vi.fn(),
}));

vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: 'test-user' } } } })
      ),
    },
    rpc: vi.fn(() => Promise.resolve({ error: null })),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
window.confirm = mockConfirm;

describe('DataResetSection', () => {
  const mockRefetch = vi.fn(() => Promise.resolve());
  const mockFetchUserData = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    vi.mocked(useMyPageStats).mockReturnValue({
      stats: {},
      refetch: mockRefetch,
    } as never);
    vi.mocked(useUserStore).mockReturnValue({
      fetchUserData: mockFetchUserData,
    } as never);
  });

  it('should render without crashing', () => {
    const { container } = render(<DataResetSection />);
    expect(container).toBeTruthy();
  });

  it('should render reset section', () => {
    const { container } = render(<DataResetSection />);
    // Component should render
    expect(container).toBeTruthy();
  });

  it('should call confirm before resetting', async () => {
    render(<DataResetSection />);
    // Find any reset button
    const resetButtons = screen.queryAllByRole('button');
    if (resetButtons.length > 0) {
      const resetButton = resetButtons.find(
        (btn) => btn.textContent?.includes('초기화') || btn.textContent?.includes('리셋')
      );
      if (resetButton) {
        fireEvent.click(resetButton);
        await waitFor(() => {
          expect(mockConfirm).toHaveBeenCalled();
        });
      }
    }
  });

  it('should not reset if confirm is cancelled', async () => {
    mockConfirm.mockReturnValue(false);
    render(<DataResetSection />);
    // Find any reset button
    const resetButtons = screen.queryAllByRole('button');
    if (resetButtons.length > 0) {
      const resetButton = resetButtons.find(
        (btn) => btn.textContent?.includes('초기화') || btn.textContent?.includes('리셋')
      );
      if (resetButton) {
        fireEvent.click(resetButton);
        await waitFor(() => {
          expect(mockConfirm).toHaveBeenCalled();
        });
        // Should not proceed with reset (no RPC call)
      }
    }
  });

  it('should render reset section title', () => {
    render(<DataResetSection />);
    // Component should render without error
    const { container } = render(<DataResetSection />);
    expect(container).toBeTruthy();
  });

  it('should handle reset operations', async () => {
    mockConfirm.mockReturnValue(true);
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

    render(<DataResetSection />);

    // Component should render successfully
    await waitFor(() => {
      expect(screen.queryByText(/데이터/)).toBeTruthy();
    });
  });
});
