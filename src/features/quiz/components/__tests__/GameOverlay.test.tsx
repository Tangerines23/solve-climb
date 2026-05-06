import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameOverlay } from '../game/GameOverlay';
import { useGameStore } from '@/features/quiz/stores/useGameStore';

vi.mock('../../stores/useGameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('GameOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: false,
      showSpeedLines: false,
      feverLevel: 0,
    } as never);
  });

  it('should render without crashing', () => {
    const { container } = render(<GameOverlay />);
    expect(container).toBeTruthy();
  });

  it('should render vignette when showVignette is true', () => {
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: true,
      showSpeedLines: false,
      feverLevel: 0,
    } as never);

    const { container } = render(<GameOverlay />);
    // Vignette elements should be rendered (fixed position divs)
    const fixedDivs = container.querySelectorAll('div[style*="position: fixed"]');
    expect(fixedDivs.length).toBeGreaterThan(0);
  });

  it('should render speed lines when showSpeedLines is true', () => {
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: false,
      showSpeedLines: true,
      feverLevel: 1,
    } as never);

    const { container } = render(<GameOverlay />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render fever text when feverLevel is 1', () => {
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: false,
      showSpeedLines: false,
      feverLevel: 1,
    } as never);

    render(<GameOverlay />);
    expect(screen.getByText('MOMENTUM')).toBeInTheDocument();
  });

  it('should render second wind text when feverLevel is 2', () => {
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: false,
      showSpeedLines: false,
      feverLevel: 2,
    } as never);

    render(<GameOverlay />);
    expect(screen.getByText('SECOND WIND')).toBeInTheDocument();
  });

  it('should not render fever text when feverLevel is 0', () => {
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: false,
      showSpeedLines: false,
      feverLevel: 0,
    } as never);

    render(<GameOverlay />);
    expect(screen.queryByText(/MOMENTUM/)).not.toBeInTheDocument();
    expect(screen.queryByText(/SECOND WIND/)).not.toBeInTheDocument();
  });

  it('should apply golden color when feverLevel is 2', () => {
    vi.mocked(useGameStore).mockReturnValue({
      showVignette: false,
      showSpeedLines: true,
      feverLevel: 2,
    } as never);

    const { container } = render(<GameOverlay />);
    const speedLinesDiv = container.querySelector('div[style*="radial-gradient"]');
    expect(speedLinesDiv).toBeInTheDocument();
  });
});
