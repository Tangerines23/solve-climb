import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RoadmapPage } from '../RoadmapPage';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock ResizeObserver
class ResizeObserverMockClass {
  static constructorMock = vi.fn();
  constructor(callback: any) {
    ResizeObserverMockClass.constructorMock(callback);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Use the mock function in the global stub to allow tracking
vi.stubGlobal('ResizeObserver', ResizeObserverMockClass);

// Mock DOM methods
HTMLElement.prototype.scrollIntoView = vi.fn();
if (!HTMLElement.prototype.getBoundingClientRect) {
  HTMLElement.prototype.getBoundingClientRect = vi.fn(
    () =>
      ({
        width: 300,
        height: 200,
        top: 100,
        left: 100,
        bottom: 300,
        right: 400,
        x: 100,
        y: 100,
        toJSON: () => {},
      }) as DOMRect
  );
}

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const mockStats = {
  totalAltitude: 5000,
  userTitle: '테스트 클라이머',
  streakCount: 5,
  nextTierName: 'Professional',
  nextTierGoal: 10000,
  smartComment: '잘하고 있어요!',
};

const mockHistoryData = {
  stats: mockStats,
  streak: 5,
  heatmap: [],
  loading: false,
  error: null,
  refetch: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../hooks/useHistoryData', () => ({
  useHistoryData: vi.fn(() => mockHistoryData),
}));

const mockLayoutData = {
  nodes: [{ id: '1', altitude: 0, isTier: true, bottom: 200, label: 'Start', type: 'tier' }],
  gaugeHeight: 100,
  BOTTOM_SAFETY_MARGIN: 36,
};

vi.mock('../../hooks/useRoadmapLayout', () => ({
  useRoadmapLayout: vi.fn(() => ({
    displayRatio: 1,
    isScaling: false,
    showZoomIndicator: false,
    visibleAltRange: { min: 0, max: 10000 },
    gaugeHeight: '50%',
    setGaugeHeight: vi.fn(),
    roadmapData: { currentIdx: 0, cardIndices: [0] },
    layoutData: mockLayoutData,
    cameraRef: { current: null },
    roadmapScrollRef: { current: null },
    VIRTUAL_RAIL_HEIGHT: 1000,
    getAltitudeY: (alt: number) => alt,
  })),
}));

vi.mock('../../hooks/useBadgeChecker', () => ({
  useBadgeChecker: vi.fn(() => ({
    hasBadge: vi.fn().mockReturnValue(true),
    loading: false,
    checkAndAwardBadges: vi.fn(),
  })),
}));

vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('../../utils/haptic', () => ({
  vibrateShort: vi.fn(),
}));

vi.mock('../../components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">FooterNav</div>,
}));

vi.mock('../../components/BadgeSlot', () => ({
  BadgeCollection: () => <div data-testid="badge-collection">BadgeCollection</div>,
}));

vi.mock('../../components/my/HistoryTab', () => ({
  HistoryTab: () => <div data-testid="history-tab">HistoryTab</div>,
}));

// Mock CSS
vi.mock('../RoadmapPage.css', () => ({}));

describe('RoadmapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <BrowserRouter>
        <RoadmapPage />
      </BrowserRouter>
    );

  it('should render the roadmap page with summary tab by default', async () => {
    renderPage();

    expect(screen.getByText(/테스트 클라이머/)).toBeInTheDocument();
    expect(screen.getAllByText(/5[.,]000\s*m/)[0]).toBeInTheDocument();
    expect(screen.getByText(/잘하고 있어요!/)).toBeInTheDocument();
    expect(await screen.findByTestId('badge-collection')).toBeInTheDocument();
  });

  it('should switch to history tab', async () => {
    renderPage();
    const historyTabButton = screen.getByText('진행 통계 📊');
    fireEvent.click(historyTabButton);
    // Switch state internal to the component is triggered
  });

  it('should open and close the roadmap overlay', async () => {
    renderPage();
    const expandButton = screen.getByText('전체 일지 보기 🗺️');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('등반 일지')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('등반 일지')).not.toBeInTheDocument();
    });
  });

  it('should open roadmap overlay when Enter or Space is pressed on expand hint', async () => {
    renderPage();
    const expandHint = screen.getByLabelText('로드맵 전체 보기');

    // Test Enter
    fireEvent.keyDown(expandHint, { key: 'Enter', code: 'Enter' });
    expect(await screen.findByText('등반 일지')).toBeInTheDocument();
    fireEvent.click(screen.getByText('✕'));

    // Test Space
    await waitFor(() => expect(screen.queryByText('등반 일지')).not.toBeInTheDocument());
    fireEvent.keyDown(expandHint, { key: ' ', code: 'Space' });
    expect(await screen.findByText('등반 일지')).toBeInTheDocument();
  });

  it('should handle resize and update gauge', async () => {
    renderPage();

    // Open roadmap overlay to trigger ResizeObserver creation
    const expandButton = screen.getByText('전체 일지 보기 🗺️');
    fireEvent.click(expandButton);

    await waitFor(
      () => {
        expect(ResizeObserverMockClass.constructorMock).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Check if the page is still responsive
    expect(screen.getAllByText(/테스트 클라이머/)[0]).toBeInTheDocument();
  });

  it('should render gauge with correct CSS variable', async () => {
    renderPage();
    fireEvent.click(screen.getByText('전체 일지 보기 🗺️'));

    await waitFor(() => {
      const gauge = document.querySelector('.path-line-fill');
      expect(gauge).toBeTruthy();
      if (gauge) {
        const style = (gauge as HTMLElement).style;
        expect(style.getPropertyValue('--fill-height')).toBe('50%');
      }
    });
  });
});
