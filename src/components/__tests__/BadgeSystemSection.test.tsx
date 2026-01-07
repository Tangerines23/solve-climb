import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeSystemSection } from '../debug/BadgeSystemSection';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: vi.fn(() => ({
    progress: {},
  })),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

describe('BadgeSystemSection', () => {
  it('should render badge system section', () => {
    render(<BadgeSystemSection />);
    expect(screen.getByText(/뱃지 시스템/)).toBeInTheDocument();
  });
});


