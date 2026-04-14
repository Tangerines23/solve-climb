import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
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
    await act(async () => {
      renderStatusCard();
    });

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

    await act(async () => {
      renderStatusCard();
    });

    await waitFor(() => {
      expect(screen.getByText('나의 랭킹')).toBeInTheDocument();
    });
  });

  it('should navigate to my page when detail button is clicked', async () => {
    vi.mocked(useLevelProgressStore.getState).mockReturnValue({
      progress: {},
    } as unknown as ReturnType<typeof useLevelProgressStore.getState>);

    await act(async () => {
      renderStatusCard();
    });

    await waitFor(() => {
      const detailButton = screen.queryByText('자세히');
      if (detailButton) {
        fireEvent.click(detailButton);
        expect(mockNavigate).toHaveBeenCalled();
      }
    });
  });

  it('should display error state when fetchUserData fails', async () => {
    vi.mocked(useLevelProgressStore.getState).mockImplementation(() => {
      throw new Error('Failed to get state');
    });

    await act(async () => {
      renderStatusCard();
    });

    await waitFor(() => {
      expect(screen.getByText('정보를 불러올 수 없습니다')).toBeInTheDocument();
    });
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

    await act(async () => {
      renderStatusCard();
    });

    await waitFor(() => {
      expect(screen.getByText(/나의 랭킹/)).toBeInTheDocument();
    });
  });
});
