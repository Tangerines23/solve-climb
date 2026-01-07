import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaminaGauge } from '../StaminaGauge';
import { useUserStore } from '../../stores/useUserStore';

// Mock useUserStore
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

describe('StaminaGauge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stamina value', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 3 });
    render(<StaminaGauge />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/5')).toBeInTheDocument();
  });

  it('should render full stamina', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 5 });
    render(<StaminaGauge />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render empty stamina', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 0 });
    render(<StaminaGauge />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render low stamina', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 2 });
    render(<StaminaGauge />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should apply shake class when stamina is 0', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 0 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).toHaveClass('shake');
  });

  it('should not apply shake class when stamina is not 0', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).not.toHaveClass('shake');
  });

  it('should apply pulse class when stamina is full', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 5 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    expect(lightning).toHaveClass('pulse');
  });

  it('should not apply pulse class when stamina is not full', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    expect(lightning).not.toHaveClass('pulse');
  });

  it('should render stamina bar with correct percentage', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const barFill = container.querySelector('.stamina-bar-fill');
    expect(barFill).toHaveStyle({ width: '60%' });
  });

  it('should render stamina bar at 100% when stamina is full', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 5 });
    const { container } = render(<StaminaGauge />);
    const barFill = container.querySelector('.stamina-bar-fill');
    expect(barFill).toHaveStyle({ width: '100%' });
  });

  it('should render stamina bar at 0% when stamina is empty', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 0 });
    const { container } = render(<StaminaGauge />);
    const barFill = container.querySelector('.stamina-bar-fill');
    expect(barFill).toHaveStyle({ width: '0%' });
  });

  it('should render dividers at correct positions', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const dividers = container.querySelectorAll('.stamina-bar-divider');
    expect(dividers).toHaveLength(4);
  });

  it('should use red color when stamina is 0', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 0 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    expect(lightning).toHaveAttribute('fill', '#ff4d4d');
  });

  it('should use yellow color when stamina is low (<=2)', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 2 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    expect(lightning).toHaveAttribute('fill', '#ffca28');
  });

  it('should use green color when stamina is good (>2)', () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    expect(lightning).toHaveAttribute('fill', '#4cd964');
  });
});

