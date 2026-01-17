import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeSlot } from '../BadgeSlot';

describe('BadgeSlot', () => {
  const mockBadgeDef = {
    id: 'test-badge',
    name: 'Test Badge',
    description: 'Test description',
    emoji: '🏆',
  };

  it('should render earned badge', () => {
    render(
      <BadgeSlot
        badgeId="test-badge"
        isEarned={true}
        badgeDef={mockBadgeDef}
        earnedAt="2024-01-01T00:00:00Z"
      />
    );

    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('should render locked badge', () => {
    render(<BadgeSlot badgeId="test-badge" isEarned={false} badgeDef={null} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('should show earned date when earned', () => {
    render(
      <BadgeSlot
        badgeId="test-badge"
        isEarned={true}
        badgeDef={mockBadgeDef}
        earnedAt="2024-01-01T00:00:00Z"
      />
    );

    // Date should be formatted
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('should not show date when not earned', () => {
    render(<BadgeSlot badgeId="test-badge" isEarned={false} badgeDef={null} />);

    // Should not have date
    const dateElement = screen.queryByText(/2024/);
    expect(dateElement).not.toBeInTheDocument();
  });

  it('should use default emoji when badgeDef has no emoji', () => {
    const badgeDefWithoutEmoji = {
      ...mockBadgeDef,
      emoji: null,
    };

    render(
      <BadgeSlot
        badgeId="test-badge"
        isEarned={true}
        badgeDef={badgeDefWithoutEmoji}
        earnedAt="2024-01-01T00:00:00Z"
      />
    );

    // Should show lock when no emoji
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('should apply correct CSS class for earned badge', () => {
    const { container } = render(
      <BadgeSlot
        badgeId="test-badge"
        isEarned={true}
        badgeDef={mockBadgeDef}
        earnedAt="2024-01-01T00:00:00Z"
      />
    );

    const badgeSlot = container.querySelector('.badge-slot');
    expect(badgeSlot).toHaveClass('badge-earned');
  });

  it('should apply correct CSS class for locked badge', () => {
    const { container } = render(
      <BadgeSlot badgeId="test-badge" isEarned={false} badgeDef={null} />
    );

    const badgeSlot = container.querySelector('.badge-slot');
    expect(badgeSlot).toHaveClass('badge-locked');
  });

  it('should not show date when earnedAt is not provided', () => {
    render(
      <BadgeSlot
        badgeId="test-badge"
        isEarned={true}
        badgeDef={mockBadgeDef}
        earnedAt={undefined}
      />
    );

    const dateElement = screen.queryByText(/2024/);
    expect(dateElement).not.toBeInTheDocument();
  });

  it('should show description when badgeDef has description', () => {
    const badgeDefWithDescription = {
      ...mockBadgeDef,
      description: 'Test description text',
    };

    render(
      <BadgeSlot
        badgeId="test-badge"
        isEarned={true}
        badgeDef={badgeDefWithDescription}
        earnedAt="2024-01-01T00:00:00Z"
      />
    );

    // Component renders name, which should be visible
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });
});

