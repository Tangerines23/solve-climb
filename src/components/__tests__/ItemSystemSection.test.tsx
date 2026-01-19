import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ItemSystemSection } from '../debug/ItemSystemSection';
import { supabase } from '../../utils/supabaseClient';
import { useUserStore } from '../../stores/useUserStore';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('ItemSystemSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserStore).mockReturnValue({
      inventory: [],
      fetchUserData: vi.fn(),
      consumeItem: vi.fn(),
    } as never);
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [{ id: 1, code: 'oxygen_tank', name: '산소통', description: '시간 추가' }],
          error: null,
        }),
      }),
    } as any);
  });

  it('should render without crashing', async () => {
    const { container } = render(<ItemSystemSection />);
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('should render item system section title', async () => {
    render(<ItemSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/아이템 시스템/)).toBeInTheDocument();
    });
  });

  it('should render reset inventory button', async () => {
    render(<ItemSystemSection />);
    await waitFor(() => {
      expect(screen.getByText(/인벤토리 초기화/)).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    render(<ItemSystemSection />);
    expect(screen.getByText(/아이템 불러오는 중/)).toBeInTheDocument();
  });
});
