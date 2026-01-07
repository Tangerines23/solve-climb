import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BoundaryTestSection } from '../debug/BoundaryTestSection';
import { useUserStore } from '../../stores/useUserStore';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../../hooks/useMyPageStats', () => ({
  useMyPageStats: vi.fn(),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

describe('BoundaryTestSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      setMinerals: vi.fn(),
      setStamina: vi.fn(),
      fetchUserData: vi.fn(),
    } as never);
    vi.mocked(useMyPageStats).mockReturnValue({
      refetch: vi.fn(),
    } as never);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    } as never);
  });

  it('should render without crashing', () => {
    const { container } = render(<BoundaryTestSection />);
    expect(container).toBeTruthy();
  });

  it('should render boundary test section', () => {
    render(<BoundaryTestSection />);
    expect(screen.getByText(/경계값 테스트/)).toBeInTheDocument();
  });

  it('should render stamina test controls', () => {
    render(<BoundaryTestSection />);
    expect(screen.getByText(/스태미나/)).toBeInTheDocument();
  });

  it('should render minerals test controls', () => {
    render(<BoundaryTestSection />);
    expect(screen.getByText(/미네랄/)).toBeInTheDocument();
  });

  it('should render tier test controls', () => {
    render(<BoundaryTestSection />);
    expect(screen.getByText(/티어/)).toBeInTheDocument();
  });
});


