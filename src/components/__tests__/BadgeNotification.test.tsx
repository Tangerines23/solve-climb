import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BadgeNotification } from '../BadgeNotification';

// Mock supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
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
});

