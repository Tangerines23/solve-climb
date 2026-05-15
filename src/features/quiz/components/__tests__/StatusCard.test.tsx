import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StatusCard } from '../StatusCard';
import { useStatusCard } from '../../hooks/bridge/useStatusCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/bridge/useStatusCard', () => ({
  useStatusCard: vi.fn(),
}));

describe('StatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStatusCard).mockReturnValue({
      bestScore: 0,
      navigateToMyPage: vi.fn(),
    });
  });

  const renderStatusCard = () => {
    return render(
      <BrowserRouter>
        <StatusCard />
      </BrowserRouter>
    );
  };

  it('should render success state after mount', async () => {
    vi.mocked(useStatusCard).mockReturnValue({
      bestScore: 100,
      navigateToMyPage: vi.fn(),
    });

    renderStatusCard();

    await waitFor(() => {
      expect(document.querySelector('.status-card.success')).toBeTruthy();
      expect(document.querySelector('.status-card-header')).toBeTruthy();
    });
  });

  it('should navigate to my page when detail button is clicked', async () => {
    const mockNavigateToMyPage = vi.fn();
    vi.mocked(useStatusCard).mockReturnValue({
      bestScore: 0,
      navigateToMyPage: mockNavigateToMyPage,
    });

    renderStatusCard();

    await waitFor(() => {
      const detailButton = document.querySelector('.status-detail-link');
      expect(detailButton).toBeTruthy();
      if (detailButton) {
        fireEvent.click(detailButton);
        expect(mockNavigateToMyPage).toHaveBeenCalled();
      }
    });
  });

  it('should display record progress when bestScore is 0', async () => {
    vi.mocked(useStatusCard).mockReturnValue({
      bestScore: 0,
      navigateToMyPage: vi.fn(),
    });

    renderStatusCard();

    await waitFor(() => {
      const rankElement = document.querySelector('.status-rank');
      expect(rankElement).toBeTruthy();
      // Since totalRank is 0 in the component's internal state
      expect(rankElement?.textContent).toContain('기록 측정 중');
    });
  });
});
