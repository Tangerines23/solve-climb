import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    if (option1) fireEvent.click(option1);

    expect(onSelect).toHaveBeenCalledWith(60);
  });

  it('should display time in seconds', () => {
    const onSelect = vi.fn();
    render(<TimeSelector onSelect={onSelect} />);

    expect(screen.getByText('60초')).toBeInTheDocument();
    expect(screen.getByText('120초')).toBeInTheDocument();
    expect(screen.getByText('180초')).toBeInTheDocument();
  });

  it('should call onSelect with correct time for each option', () => {
    const onSelect = vi.fn();
    render(<TimeSelector onSelect={onSelect} />);

    const option1 = screen.getByText('1분').closest('.time-card');
    if (option1) fireEvent.click(option1);
    expect(onSelect).toHaveBeenCalledWith(60);

    const option2 = screen.getByText('2분').closest('.time-card');
    if (option2) fireEvent.click(option2);
    expect(onSelect).toHaveBeenCalledWith(120);

    const option3 = screen.getByText('3분').closest('.time-card');
    if (option3) fireEvent.click(option3);
    expect(onSelect).toHaveBeenCalledWith(180);
  });

  it('should render title', () => {
    const onSelect = vi.fn();
    render(<TimeSelector onSelect={onSelect} />);

    expect(screen.getByText('시간을 선택하세요')).toBeInTheDocument();
  });

  it('should render all time cards', () => {
    const onSelect = vi.fn();
    const { container } = render(<TimeSelector onSelect={onSelect} />);

    const timeCards = container.querySelectorAll('.time-card');
    expect(timeCards).toHaveLength(3);
  });

  it('should render time selector container', () => {
    const onSelect = vi.fn();
    const { container } = render(<TimeSelector onSelect={onSelect} />);

    const selectorContainer = container.querySelector('.time-selector-container');
    expect(selectorContainer).toBeInTheDocument();
  });
});
