import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnknownMountainCard } from '../UnknownMountainCard';

describe('UnknownMountainCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render card content', () => {
    render(<UnknownMountainCard />);

    expect(screen.getByText('미지의 산')).toBeInTheDocument();
    expect(screen.getByText('베이스캠프 구축 중')).toBeInTheDocument();
  });

  it('should call onToast when clicked', () => {
    const onToast = vi.fn();
    render(<UnknownMountainCard onToast={onToast} />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');
    card?.click();

    expect(onToast).toHaveBeenCalled();
  });

  it('should handle click cooldown', () => {
    const onToast = vi.fn();
    render(<UnknownMountainCard onToast={onToast} />);

    const card = screen.getByText('미지의 산').closest('.unknown-mountain-card');

    // First click
    card?.click();
    expect(onToast).toHaveBeenCalledTimes(1);

    // Second click immediately (should be ignored due to cooldown)
    card?.click();
    expect(onToast).toHaveBeenCalledTimes(1);
  });
});

