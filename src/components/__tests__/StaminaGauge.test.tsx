import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaminaGauge } from '../StaminaGauge';
import { useUserStore } from '../../stores/useUserStore';

// Mock useUserStore
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

// Helper: mock Zustand store so selectors work correctly
function mockZustandStore(hookFn: ReturnType<typeof vi.fn>, state: Record<string, unknown>) {
  hookFn.mockImplementation((selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(state) : state
  );
}

describe('StaminaGauge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stamina value', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 3 });
    render(<StaminaGauge />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/5')).toBeInTheDocument();
  });

  it('should render full stamina', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 5 });
    render(<StaminaGauge />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render empty stamina', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 0 });
    render(<StaminaGauge />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render low stamina', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 2 });
    render(<StaminaGauge />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should apply shake class when stamina is 0', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 0 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).toHaveClass('shake');
  });

  it('should not apply shake class when stamina is not 0', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).not.toHaveClass('shake');
  });

  it('should apply pulse class when stamina is full', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 5 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    // We expect the svg to have both stamina-lightning and pulse classes
    expect(lightning).toHaveClass('stamina-lightning', 'pulse');
  });

  it('should not apply pulse class when stamina is not full', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const lightning = container.querySelector('.stamina-lightning');
    expect(lightning).not.toHaveClass('pulse');
  });

  it('should render stamina bar with correct percentage', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const barFill = container.querySelector('.stamina-bar-fill');
    expect(barFill).toHaveStyle({ width: '60%' });
  });

  it('should render stamina bar at 100% when stamina is full', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 5 });
    const { container } = render(<StaminaGauge />);
    const barFill = container.querySelector('.stamina-bar-fill');
    expect(barFill).toHaveStyle({ width: '100%' });
  });

  it('should render stamina bar at 0% when stamina is empty', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 0 });
    const { container } = render(<StaminaGauge />);
    const barFill = container.querySelector('.stamina-bar-fill');
    expect(barFill).toHaveStyle({ width: '0%' });
  });

  it('should render dividers at correct positions', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 3 });
    const { container } = render(<StaminaGauge />);
    const dividers = container.querySelectorAll('.stamina-bar-divider');
    expect(dividers).toHaveLength(4);
  });

  it('should set data-stamina to 0 when stamina is empty', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 0 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).toHaveAttribute('data-stamina', '0');
  });

  it('should set data-stamina to low values correctly', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 2 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).toHaveAttribute('data-stamina', '2');
  });

  it('should set data-stamina to high values correctly', () => {
    mockZustandStore(vi.mocked(useUserStore), { stamina: 5 });
    const { container } = render(<StaminaGauge />);
    const gaugeContainer = container.querySelector('.stamina-gauge-container');
    expect(gaugeContainer).toHaveAttribute('data-stamina', '5');
  });
});
