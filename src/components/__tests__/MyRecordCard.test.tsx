import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyRecordCard } from '../MyRecordCard';

// Mock useLevelProgressStore
const mockGetBestRecords = vi.fn(() => ({ 'time-attack': null, survival: null }));
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: (selector: (state: unknown) => unknown) => {
    const mockState = {
      getBestRecords: mockGetBestRecords,
    };
    return selector(mockState);
  },
}));

describe('MyRecordCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render loading state initially', () => {
    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);
    expect(screen.queryByText('사칙연산 최고 기록')).not.toBeInTheDocument();
  });
});

