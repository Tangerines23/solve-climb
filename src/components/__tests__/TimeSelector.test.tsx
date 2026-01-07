import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeSelector } from '../TimeSelector';

describe('TimeSelector', () => {
  it('should render all time options', () => {
    const onSelect = vi.fn();
    render(<TimeSelector onSelect={onSelect} />);

    expect(screen.getByText('1분')).toBeInTheDocument();
    expect(screen.getByText('2분')).toBeInTheDocument();
    expect(screen.getByText('3분')).toBeInTheDocument();
  });

  it('should call onSelect when option is clicked', () => {
    const onSelect = vi.fn();
    render(<TimeSelector onSelect={onSelect} />);

    const option1 = screen.getByText('1분').closest('.time-card');
    option1?.click();

    expect(onSelect).toHaveBeenCalledWith(60);
  });

  it('should display time in seconds', () => {
    const onSelect = vi.fn();
    render(<TimeSelector onSelect={onSelect} />);

    expect(screen.getByText('60초')).toBeInTheDocument();
    expect(screen.getByText('120초')).toBeInTheDocument();
    expect(screen.getByText('180초')).toBeInTheDocument();
  });
});

