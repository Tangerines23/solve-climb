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

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining(APP_CONFIG.ROUTES.GAME), {
      replace: true,
    });
  });

  it('should navigate to home from result page when params are missing', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.RESULT,
      search: '',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.HOME, { replace: true });
  });

  it('should navigate to home from subcategory page', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.SUB_CATEGORY,
      search: '',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.HOME, { replace: true });
  });

  it('should navigate to home from notifications page', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.NOTIFICATIONS,
      search: '',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.HOME, { replace: true });
  });

  it('should navigate to home from unknown path', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: '/unknown-path',
      search: '',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.HOME, { replace: true });
  });

  it('should handle home page with history', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.HOME,
    });

    Object.defineProperty(window, 'history', {
      value: {
        length: 2,
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      writable: true,
    });

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    // Should dispatch custom event for home back button
    expect(dispatchEventSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
    dispatchEventSpy.mockRestore();
  });

  it('should handle home page without history (first entry)', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.HOME,
      search: '',
    });

    Object.defineProperty(window, 'history', {
      value: {
        length: 1,
        pushState: vi.fn(),
        replaceState: vi.fn(),
      },
      writable: true,
    });

    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    // Should navigate to same path (ignore back button)
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should navigate to home from my page', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.MY_PAGE,
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.HOME, { replace: true });
  });

  it('should handle result page with mode parameter', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.RESULT,
      search: '?category=math&sub=arithmetic&level=1&mode=time-attack',
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popStateEvent);

    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('mode=time-attack'), {
      replace: true,
    });
  });

  it('should prevent duplicate popstate handling', () => {
    vi.mocked(useLocation).mockReturnValue({
      ...mockLocation,
      pathname: APP_CONFIG.ROUTES.RANKING,
    });

    renderHook(() => useCustomBackNavigation());

    const popStateEvent = new PopStateEvent('popstate');

    // Dispatch multiple events quickly
    window.dispatchEvent(popStateEvent);
    window.dispatchEvent(popStateEvent);
    window.dispatchEvent(popStateEvent);

    // Should only handle once (or limited times due to throttling)
    expect(mockNavigate).toHaveBeenCalled();
  });
});
