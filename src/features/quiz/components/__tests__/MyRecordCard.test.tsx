import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MyRecordCard } from '../MyRecordCard';

// Mock useLevelProgressStore
const mockGetBestRecords = vi.fn(() => ({ 'time-attack': null, survival: null }));
vi.mock('@/features/quiz/stores/useLevelProgressStore', () => ({
  useLevelProgressStore: (selector: (state: any) => any) => {
    const mockState = {
      getBestRecords: mockGetBestRecords,
    };
    return selector(mockState);
  },
}));

describe('MyRecordCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBestRecords.mockReturnValue({ 'time-attack': null, survival: null });
  });

  it('should render loading state initially', async () => {
    await act(async () => {
      render(<MyRecordCard world="math" category="arithmetic" categoryName="사칙연산" />);
    });
    expect(screen.queryByText('사칙연산 최고 기록')).not.toBeInTheDocument();
  });

  it('should render records after loading', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': 1000,
      survival: 2000,
    });

    await act(async () => {
      render(<MyRecordCard world="math" category="arithmetic" categoryName="사칙연산" />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

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

    await act(async () => {
      render(<MyRecordCard world="math" category="arithmetic" categoryName="사칙연산" />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const noRecordTexts = screen.getAllByText('기록 없음');
    expect(noRecordTexts.length).toBeGreaterThan(0);
  });

  it('should display only time-attack record when survival is null', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': 1500,
      survival: null,
    });

    await act(async () => {
      render(<MyRecordCard world="math" category="arithmetic" categoryName="사칙연산" />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText('1,500m')).toBeInTheDocument();
    expect(screen.getByText('기록 없음')).toBeInTheDocument();
  });

  it('should display only survival record when time-attack is null', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': null,
      survival: 3000,
    });

    await act(async () => {
      render(<MyRecordCard world="math" category="arithmetic" categoryName="사칙연산" />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText('3,000m')).toBeInTheDocument();
    expect(screen.getByText('기록 없음')).toBeInTheDocument();
  });

  it('should format numbers with locale string', async () => {
    mockGetBestRecords.mockReturnValue({
      'time-attack': 1234567,
      survival: 9876543,
    });

    await act(async () => {
      render(<MyRecordCard world="math" category="arithmetic" categoryName="사칙연산" />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('사칙연산 최고 기록')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText(/1,234,567m/)).toBeInTheDocument();
    expect(screen.getByText(/9,876,543m/)).toBeInTheDocument();
  });
});
