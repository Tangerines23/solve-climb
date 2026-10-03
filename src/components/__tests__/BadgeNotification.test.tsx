import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BadgeNotification, filterBadgesByIds } from '../BadgeNotification';
import { useBadgeStore, type BadgeDefinition } from '../../stores/useBadgeStore';

const mockDefinitions: BadgeDefinition[] = [
  {
    id: 'badge1',
    name: 'First Badge',
    description: 'First badge description',
    emoji: '🏆',
  },
  {
    id: 'badge2',
    name: 'Second Badge',
    description: null,
    emoji: '⭐',
  },
  {
    id: 'badge3',
    name: 'Emoji-less Badge',
    description: 'No emoji badge',
    emoji: null,
  },
];

describe('BadgeNotification & filterBadgesByIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBadgeStore.setState({
      badgeDefinitions: mockDefinitions,
      isLoadingDefinitions: false,
    });
  });

  describe('filterBadgesByIds', () => {
    it('should return empty array when badgeIds is empty', () => {
      expect(filterBadgesByIds(mockDefinitions, [])).toEqual([]);
    });

    it('should return matched badges correctly', () => {
      const result = filterBadgesByIds(mockDefinitions, ['badge1', 'badge2']);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('badge1');
      expect(result[1].id).toBe('badge2');
    });

    it('should ignore non-existent badgeIds', () => {
      const result = filterBadgesByIds(mockDefinitions, ['badge1', 'non-existent']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('badge1');
    });
  });

  describe('BadgeNotification Component', () => {
    it('should not render when badgeIds is empty', () => {
      const { container } = render(<BadgeNotification badgeIds={[]} onClose={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when no matching badge definitions found', () => {
      const { container } = render(
        <BadgeNotification badgeIds={['non-existent-badge']} onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render badge notification when badgeIds are provided from store', () => {
      render(<BadgeNotification badgeIds={['badge1']} onClose={vi.fn()} />);

      expect(screen.getByText('🎉 뱃지 획득! 🎉')).toBeInTheDocument();
      expect(screen.getByText('First Badge')).toBeInTheDocument();
      expect(screen.getByText('First badge description')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should render multiple badges', () => {
      render(<BadgeNotification badgeIds={['badge1', 'badge2']} onClose={vi.fn()} />);

      expect(screen.getByText('First Badge')).toBeInTheDocument();
      expect(screen.getByText('Second Badge')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('should use default emoji when emoji is null', () => {
      render(<BadgeNotification badgeIds={['badge3']} onClose={vi.fn()} />);

      expect(screen.getByText('Emoji-less Badge')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('should not render description when description is null', () => {
      render(<BadgeNotification badgeIds={['badge2']} onClose={vi.fn()} />);

      expect(screen.getByText('Second Badge')).toBeInTheDocument();
      expect(screen.queryByText('First badge description')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<BadgeNotification badgeIds={['badge1']} onClose={onClose} />);

      const closeButton = screen.getByText('확인');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      const onClose = vi.fn();
      render(<BadgeNotification badgeIds={['badge1']} onClose={onClose} />);

      const overlay = screen.getByText('🎉 뱃지 획득! 🎉').closest('.badge-notification-overlay');
      expect(overlay).not.toBeNull();
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should render custom badges passed via prop directly without store lookup', () => {
      const custom: BadgeDefinition[] = [
        {
          id: 'custom1',
          name: 'Direct Injected Badge',
          description: 'Direct desc',
          emoji: '🎖️',
        },
      ];

      render(<BadgeNotification badgeIds={['custom1']} badges={custom} onClose={vi.fn()} />);

      expect(screen.getByText('Direct Injected Badge')).toBeInTheDocument();
      expect(screen.getByText('Direct desc')).toBeInTheDocument();
      expect(screen.getByText('🎖️')).toBeInTheDocument();
    });

    it('should trigger fetchBadgeDefinitions if store is empty', async () => {
      const mockFetch = vi.fn().mockResolvedValue(undefined);
      useBadgeStore.setState({
        badgeDefinitions: [],
        fetchBadgeDefinitions: mockFetch,
        isLoadingDefinitions: false,
      });

      render(<BadgeNotification badgeIds={['badge1']} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });
});
