import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCustomBackNavigation } from '../useCustomBackNavigation';
import { APP_CONFIG } from '../../config/app';
import { useNavigate, useLocation } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

describe('useCustomBackNavigation', () => {
  const mockNavigate = vi.fn();
  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue(mockLocation);
    
    // Mock window.history
    Object.defineProperty(window, 'history', {
      value: {
        length: 1,
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      writable: true,
    });
    
    // Mock document.referrer
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
    });
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => useCustomBackNavigation());
    expect(result).toBeDefined();
  });

  it('should handle popstate event for home page', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.HOME,
    });
    
    Object.defineProperty(window, 'history', {
      value: {
        length: 1,
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      writable: true,
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    // Should dispatch custom event for home back button
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should navigate to home from main pages', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.RANKING,
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.HOME, { replace: true });
  });

  it('should navigate to level-select from game page', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.GAME,
      search: '?category=math&sub=arithmetic',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining(APP_CONFIG.ROUTES.LEVEL_SELECT),
      { replace: true }
    );
  });

  it('should navigate to subcategory from level-select', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.LEVEL_SELECT,
      search: '?category=math',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining(APP_CONFIG.ROUTES.SUB_CATEGORY),
      { replace: true }
    );
  });

  it('should navigate to game from result page', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.RESULT,
      search: '?category=math&sub=arithmetic&level=1',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining(APP_CONFIG.ROUTES.GAME),
      { replace: true }
    );
  });
});

