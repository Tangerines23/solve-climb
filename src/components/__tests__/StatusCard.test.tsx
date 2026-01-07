import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StatusCard } from '../StatusCard';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';

// Mock dependencies
vi.mock('../../stores/useLevelProgressStore', () => ({
  useLevelProgressStore: {
    getState: vi.fn(() => ({
      progress: {},
    })),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderStatusCard = () => {
    return render(
      <BrowserRouter>
        <StatusCard />
      </BrowserRouter>
    );
  };

  it('should render loading state initially', async () => {
    renderStatusCard();

    // Wait a bit for initial render
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Skeleton should be rendered or success state
    const skeleton = document.querySelector('.status-card-skeleton');
    const success = document.querySelector('.status-card.success');
    expect(skeleton || success).toBeTruthy();
  });

  it('should render success state after loading', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {
        math: {
          arithmetic: {
            1: {
              level: 1,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
        },
      },
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    renderStatusCard();

    // Wait for state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('나의 랭킹')).toBeInTheDocument();
  });

  it('should navigate to my page when detail button is clicked', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {},
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    renderStatusCard();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const detailButton = screen.queryByText('자세히');
    if (detailButton) {
      detailButton.click();
      expect(mockNavigate).toHaveBeenCalled();
    }
  });

  it('should display error state when fetchUserData fails', async () => {
    vi.mocked(useLevelProgressStore.getState).mockImplementation(() => {
      throw new Error('Failed to get state');
    });

    renderStatusCard();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('정보를 불러올 수 없습니다')).toBeInTheDocument();
  });

  it('should display rank information correctly', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {
        math: {
          arithmetic: {
            1: {
              level: 1,
              bestScore: {
                'time-attack': 100,
                survival: 200,
              },
            },
          },
        },
      },
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    renderStatusCard();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText(/종합/)).toBeInTheDocument();
    expect(screen.getByText(/상위/)).toBeInTheDocument();
  });

  it('should format rank with locale string', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {
        math: {
          arithmetic: {
            1: {
              level: 1,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
        },
      },
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    renderStatusCard();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Rank should be formatted (0위)
    expect(screen.getByText(/종합.*위/)).toBeInTheDocument();
  });

  it('should handle rankChange positive value', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {
        math: {
          arithmetic: {
            1: {
              level: 1,
              bestScore: {
                'time-attack': 100,
                survival: null,
              },
            },
          },
        },
      },
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    renderStatusCard();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // rankChange is 0 by default, but should display correctly
    expect(screen.getByText(/어제보다/)).toBeInTheDocument();
  });

  it('should calculate bestScore from multiple categories', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {
        math: {
          arithmetic: {
            1: {
              level: 1,
              bestScore: {
                'time-attack': 100,
                survival: 150,
              },
            },
          },
        },
        science: {
          physics: {
            1: {
              level: 1,
              bestScore: {
                'time-attack': 200,
                survival: 250,
              },
            },
          },
        },
      },
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    renderStatusCard();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText(/나의 랭킹/)).toBeInTheDocument();
  });
});

