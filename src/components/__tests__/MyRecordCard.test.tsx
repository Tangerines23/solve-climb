import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    mockGetBestRecords.mockReturnValue({ 'time-attack': null, survival: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render loading state initially', () => {
    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);
    expect(screen.queryByText('사칙연산 최고 기록')).not.toBeInTheDocument();
  });

  it('should render records after loading', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': 1000,
      survival: 2000,
    });

    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);

    vi.advanceTimersByTime(300);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText(/타임 어택:/)).toBeInTheDocument();
    expect(screen.getByText(/서바이벌:/)).toBeInTheDocument();
    expect(screen.getByText('1,000m')).toBeInTheDocument();
    expect(screen.getByText('2,000m')).toBeInTheDocument();
  });

  it('should display "기록 없음" when no records exist', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': null,
      survival: null,
    });

    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);

    vi.advanceTimersByTime(300);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
    }, { timeout: 1000 });

    const noRecordTexts = screen.getAllByText('기록 없음');
    expect(noRecordTexts.length).toBeGreaterThan(0);
  });

  it('should display only time-attack record when survival is null', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': 1500,
      survival: null,
    });

    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);

    vi.advanceTimersByTime(300);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText('1,500m')).toBeInTheDocument();
    expect(screen.getByText('기록 없음')).toBeInTheDocument();
  });

  it('should display only survival record when time-attack is null', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': null,
      survival: 3000,
    });

    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);

    vi.advanceTimersByTime(300);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText('3,000m')).toBeInTheDocument();
    expect(screen.getByText('기록 없음')).toBeInTheDocument();
  });

  it('should format numbers with locale string', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': 1234567,
      survival: 9876543,
    });

    render(<MyRecordCard category="math" subTopic="arithmetic" subTopicName="사칙연산" />);

    vi.advanceTimersByTime(300);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText(/1,234,567m/)).toBeInTheDocument();
    expect(screen.getByText(/9,876,543m/)).toBeInTheDocument();
  });
});

