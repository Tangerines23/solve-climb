import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierSystemSection } from '../debug/TierSystemSection';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: vi.fn(() => ({
    progress: {},
  })),
}));

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: vi.fn(() => ({
    profile: null,
  })),
}));

describe('TierSystemSection', () => {
  it('should render tier system section', () => {
    render(<TierSystemSection />);
    expect(screen.getByText(/티어 시스템/)).toBeInTheDocument();
  });
});


