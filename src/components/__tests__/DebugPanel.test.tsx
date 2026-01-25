import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DebugPanel from '../DebugPanel';
import { useDebugStore } from '../../stores/useDebugStore';

// Mock dependencies
vi.mock('../../stores/useDebugStore', () => ({
  useDebugStore: vi.fn(),
}));

vi.mock('../debug/QuickActionsSection', () => ({
  QuickActionsSection: () => <div>Quick Actions</div>,
}));

vi.mock('../debug/TierSystemSection', () => ({
  TierSystemSection: () => <div>Tier System</div>,
}));

vi.mock('../debug/BadgeSystemSection', () => ({
  BadgeSystemSection: () => <div>Badge System</div>,
}));

vi.mock('../debug/GameFlowSection', () => ({
  GameFlowSection: () => <div>Game Flow</div>,
}));

vi.mock('../debug/ItemSystemSection', () => ({
  ItemSystemSection: () => <div>Item System</div>,
}));

vi.mock('../debug/DataResetSection', () => ({
  DataResetSection: () => <div>Data Reset</div>,
}));

vi.mock('../debug/ErrorLogSection', () => ({
  ErrorLogSection: () => <div>Error Log</div>,
}));

vi.mock('../debug/BoundaryTestSection', () => ({
  BoundaryTestSection: () => <div>Boundary Test</div>,
}));

describe('DebugPanel', () => {
  const mockToggleDebugPanel = vi.fn();
  const mockSetActiveTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDebugStore).mockReturnValue({
      isDebugPanelOpen: true,
      activeTab: 'quick',
      toggleDebugPanel: mockToggleDebugPanel,
      setActiveTab: mockSetActiveTab,
    } as never);
  });

  it('should not render when isDebugPanelOpen is false', () => {
    vi.mocked(useDebugStore).mockReturnValue({
      isDebugPanelOpen: false,
      activeTab: 'quick',
      toggleDebugPanel: mockToggleDebugPanel,
      setActiveTab: mockSetActiveTab,
    } as never);

    const { container } = render(<DebugPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('should render debug panel when open', () => {
    render(<DebugPanel />);

    expect(screen.getByText(/디버그 패널/)).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should close panel when close button is clicked', () => {
    render(<DebugPanel />);

    const closeButton = screen.getByLabelText('닫기');
    fireEvent.click(closeButton);

    expect(mockToggleDebugPanel).toHaveBeenCalled();
  });

  it('should switch tabs', () => {
    render(<DebugPanel />);

    const tierTab = screen.getByText(/티어/);
    fireEvent.click(tierTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith('tier');
  });

  it('should close panel when overlay is clicked', () => {
    render(<DebugPanel />);

    const overlay = document.querySelector('.debug-panel-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockToggleDebugPanel).toHaveBeenCalled();
    }
  });

  it('should render all tabs', () => {
    render(<DebugPanel />);

    expect(screen.getByText(/빠른 조작/)).toBeInTheDocument();
    expect(screen.getByText(/티어/)).toBeInTheDocument();
    expect(screen.getByText(/뱃지/)).toBeInTheDocument();
    expect(screen.getByText(/게임/)).toBeInTheDocument();
    expect(screen.getByText(/아이템/)).toBeInTheDocument();
    expect(screen.getByText(/데이터/)).toBeInTheDocument();
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
    expect(screen.getByText('경계값')).toBeInTheDocument();
    expect(screen.getByText('🌐 네트워크')).toBeInTheDocument();
    expect(screen.getByText('📱 시각')).toBeInTheDocument();
    expect(screen.getByText('🎬 매크로')).toBeInTheDocument();
    expect(screen.getByText('🏆 진행')).toBeInTheDocument();
  });

  it('should switch to different tabs', () => {
    render(<DebugPanel />);

    const badgeTab = screen.getByText(/뱃지/);
    fireEvent.click(badgeTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith('badge');

    const gameTab = screen.getByText(/게임/);
    fireEvent.click(gameTab);
    expect(mockSetActiveTab).toHaveBeenCalledWith('game');
  });

  it('should render active tab content', () => {
    vi.mocked(useDebugStore).mockReturnValue({
      isDebugPanelOpen: true,
      activeTab: 'tier',
      toggleDebugPanel: mockToggleDebugPanel,
      setActiveTab: mockSetActiveTab,
    } as never);

    render(<DebugPanel />);
    expect(screen.getByText('Tier System')).toBeInTheDocument();
  });

  it('should not close panel when panel content is clicked', () => {
    render(<DebugPanel />);

    const panelContent = document.querySelector('.debug-panel');
    if (panelContent) {
      fireEvent.click(panelContent);
      expect(mockToggleDebugPanel).not.toHaveBeenCalled();
    }
  });
});
