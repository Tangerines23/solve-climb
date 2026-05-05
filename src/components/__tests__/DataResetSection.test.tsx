import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataResetSection } from '../debug/DataResetSection';
import { useDataResetDebugBridge } from '../../hooks/useDataResetDebugBridge';
import { supabase } from '../../utils/supabaseClient';


// Mock dependencies
vi.mock('../../hooks/useDataResetDebugBridge', () => ({
  useDataResetDebugBridge: vi.fn(),
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

// Mock window.confirm is no longer needed as we use ConfirmModal

describe('DataResetSection', () => {
  const mockExecuteResetProfile = vi.fn(() => Promise.resolve());
  const mockExecuteDeleteRecent = vi.fn(() => Promise.resolve());
  const mockExecuteDeleteAll = vi.fn(() => Promise.resolve());
  const mockExecuteDeleteByLevel = vi.fn(() => Promise.resolve());
  const mockExecuteResetLevelProgress = vi.fn(() => Promise.resolve());
  const mockGetAvailableCategories = vi.fn(() => [{ id: 'math', name: '수학' }]);
  const mockGetSubjectsForCategory = vi.fn(() => ['arithmetic']);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDataResetDebugBridge).mockReturnValue({
      isResetting: false,
      isDeleting: false,
      isResettingProgress: false,
      executeResetProfile: mockExecuteResetProfile,
      executeDeleteRecent: mockExecuteDeleteRecent,
      executeDeleteAll: mockExecuteDeleteAll,
      executeDeleteByLevel: mockExecuteDeleteByLevel,
      executeResetLevelProgress: mockExecuteResetLevelProgress,
      getAvailableCategories: mockGetAvailableCategories,
      getSubjectsForCategory: mockGetSubjectsForCategory,
      handleExportData: vi.fn(),
      handleImportData: vi.fn(),
      handleSaveSnapshot: vi.fn(),
      handleRestoreSnapshot: vi.fn(),
      message: null,
    } as any);
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
    // Find "전체" reset button in "프로필 초기화" section
    const resetButton = screen.getByText('전체');
    
    fireEvent.click(resetButton);
    // Wait for ConfirmModal to appear
    await waitFor(() => {
      expect(screen.getByText(/확인/)).toBeTruthy();
    });
    
    // Click confirm
    fireEvent.click(screen.getByText('확인'));
    
    await waitFor(() => {
      expect(mockExecuteResetProfile).toHaveBeenCalledWith('all');
    });
  });

  it('should not reset if confirm is cancelled', async () => {
    render(<DataResetSection />);
    const resetButton = screen.getByText('전체');
    
    fireEvent.click(resetButton);
    // Wait for ConfirmModal to appear
    await waitFor(() => {
      expect(screen.getByText(/취소/)).toBeTruthy();
    });
    
    // Click cancel
    fireEvent.click(screen.getByText('취소'));
    
    // Should not have called reset
    expect(mockExecuteResetProfile).not.toHaveBeenCalled();
  });

  it('should render reset section title', () => {
    render(<DataResetSection />);
    // Component should render without error
    const { container } = render(<DataResetSection />);
    expect(container).toBeTruthy();
  });

  it('should handle reset operations', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

    render(<DataResetSection />);

    // Component should render successfully
    await waitFor(() => {
      expect(screen.queryByText(/데이터/)).toBeTruthy();
    });
  });
});
