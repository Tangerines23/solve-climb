import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataResetSection } from '../debug/DataResetSection';
import { resetAllData } from '../../utils/dataReset';

// Mock dependencies
vi.mock('../../utils/dataReset', () => ({
  resetAllData: vi.fn(() => Promise.resolve()),
}));

describe('DataResetSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<DataResetSection />);
    expect(container).toBeTruthy();
  });
});


