import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ItemSystemSection } from '../debug/ItemSystemSection';

// Mock dependencies
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(() => ({
    inventory: [],
  })),
}));

describe('ItemSystemSection', () => {
  it('should render without crashing', () => {
    const { container } = render(<ItemSystemSection />);
    expect(container).toBeTruthy();
  });
});


