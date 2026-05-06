import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBadgeStore } from '../useBadgeStore';
import { supabase } from '../../utils/supabaseClient';
import { storageService, STORAGE_KEYS } from '../../services';
import { createListResponse, createChainableMock } from '../../utils/__tests__/supabaseMockUtils';
import { BadgeDefinition } from '@/types/badge';

// Mock supabase and services
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('../../services', () => ({
  storageService: {
    get: vi.fn(),
    set: vi.fn(),
  },
  STORAGE_KEYS: {
    LOCAL_BADGES: 'local_badges',
  },
}));

vi.mock('../../utils/debugFetch', () => ({
  safeSupabaseQuery: vi.fn((query) => query),
}));

describe('useBadgeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBadgeStore.setState({
      badgeDefinitions: [],
      userBadges: [],
      isLoadingDefinitions: false,
      isLoadingUserBadges: false,
    });
  });

  it('should fetch badge definitions', async () => {
    const mockDefinitions = [{ id: '1', name: 'Badge 1', description: 'Desc 1', emoji: '🥇' }];

    // Setup mock chain
    const finalResponse = createListResponse(mockDefinitions);
    vi.mocked(supabase.from).mockReturnValue(createChainableMock(finalResponse));

    const { result } = renderHook(() => useBadgeStore());

    await act(async () => {
      await result.current.fetchBadgeDefinitions();
    });

    expect(result.current.badgeDefinitions).toEqual(mockDefinitions);
    expect(result.current.isLoadingDefinitions).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith('badge_definitions');
  });

  it('should not re-fetch if definitions already exist', async () => {
    useBadgeStore.setState({
      badgeDefinitions: [{ id: '1', name: 'Existing' } as unknown as BadgeDefinition],
    });

    const { result } = renderHook(() => useBadgeStore());
    await act(async () => {
      await result.current.fetchBadgeDefinitions();
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should fetch user badges for UUID user from Supabase', async () => {
    const userId = '12345678-1234-1234-1234-123456781234';
    const mockUserBadges = [{ badge_id: '1', earned_at: '2021-01-01' }];

    const finalResponse = createListResponse(mockUserBadges);
    vi.mocked(supabase.from).mockReturnValue(createChainableMock(finalResponse));

    const { result } = renderHook(() => useBadgeStore());
    await act(async () => {
      await result.current.fetchUserBadges(userId);
    });

    expect(result.current.userBadges).toEqual(mockUserBadges);
    expect(supabase.from).toHaveBeenCalledWith('user_badges');
  });

  it('should fetch local badges for non-UUID user from storageService', async () => {
    const userId = 'anonymous-123';
    const mockLocalBadges = [{ badge_id: 'local-1', earned_at: '2021-01-01' }];
    vi.mocked(storageService.get).mockReturnValue(mockLocalBadges);

    const { result } = renderHook(() => useBadgeStore());
    await act(async () => {
      await result.current.fetchUserBadges(userId);
    });

    expect(result.current.userBadges).toEqual(mockLocalBadges);
    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.LOCAL_BADGES);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should add a badge to state and storage for anonymous user', async () => {
    const userId = 'anonymous';
    const badgeId = 'new_badge';

    const { result } = renderHook(() => useBadgeStore());
    await act(async () => {
      await result.current.addUserBadge(badgeId, userId);
    });

    expect(result.current.userBadges[0].badge_id).toBe(badgeId);
    expect(storageService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.LOCAL_BADGES,
      expect.arrayContaining([expect.objectContaining({ badge_id: badgeId })])
    );
  });

  it('should prevent duplicate badges', async () => {
    const userId = 'anonymous';
    const badgeId = 'existing_badge';
    useBadgeStore.setState({ userBadges: [{ badge_id: badgeId, earned_at: 'some-date' }] });

    const { result } = renderHook(() => useBadgeStore());
    await act(async () => {
      await result.current.addUserBadge(badgeId, userId);
    });

    expect(result.current.userBadges.length).toBe(1);
    expect(storageService.set).not.toHaveBeenCalled();
  });

  it('should update state but not storage for UUID user (Server-Only Truth principle)', async () => {
    const userId = '12345678-1234-1234-1234-123456781234';
    const badgeId = 'server_badge';

    const { result } = renderHook(() => useBadgeStore());
    await act(async () => {
      await result.current.addUserBadge(badgeId, userId);
    });

    expect(result.current.userBadges[0].badge_id).toBe(badgeId);
    expect(storageService.set).not.toHaveBeenCalled();
  });
});
