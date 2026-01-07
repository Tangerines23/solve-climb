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
});

