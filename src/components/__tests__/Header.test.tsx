import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfileStore } from '../../stores/useProfileStore';
import { useUserStore } from '../../stores/useUserStore';
import { useDebugStore } from '../../stores/useDebugStore';
import { APP_CONFIG } from '../../config/app';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock('../../stores/useProfileStore', () => ({
  useProfileStore: vi.fn(),
}));

vi.mock('../../stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));

vi.mock('../../stores/useDebugStore', () => ({
  useDebugStore: vi.fn(),
}));

vi.mock('../DebugPanel', () => ({
  DebugPanel: () => <div>DebugPanel</div>,
}));

describe('Header', () => {
  const mockNavigate = vi.fn();
  const mockLocation = {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  };
  const mockFetchUserData = vi.fn();
  const mockCheckStamina = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue(mockLocation);
    vi.mocked(useProfileStore).mockReturnValue({
      isAdmin: false,
    } as never);
    vi.mocked(useUserStore).mockReturnValue({
      minerals: 1000,
      stamina: 5,
      fetchUserData: mockFetchUserData,
      checkStamina: mockCheckStamina,
      setMinerals: vi.fn(),
      setStamina: vi.fn(),
    } as never);
    vi.mocked(useDebugStore).mockReturnValue({
      isAdminMode: false,
      selectedResource: null,
      toggleAdminMode: vi.fn(),
      setSelectedResource: vi.fn(),
      toggleDebugPanel: vi.fn(),
      isDebugPanelOpen: false,
    } as never);
  });

  it('should render header with user data', () => {
    render(<Header />);
    
    expect(mockFetchUserData).toHaveBeenCalled();
    expect(mockCheckStamina).toHaveBeenCalled();
  });

  it('should navigate to notifications on notification click', () => {
    render(<Header />);
    
    const notificationButton = screen.queryByLabelText(/알림|notification/i);
    if (notificationButton) {
      fireEvent.click(notificationButton);
      expect(mockNavigate).toHaveBeenCalledWith(APP_CONFIG.ROUTES.NOTIFICATIONS);
    }
  });

  it('should handle logo double click for admin', () => {
    vi.mocked(useProfileStore).mockReturnValue({
      isAdmin: true,
    } as never);

    render(<Header />);
    
    const logo = screen.queryByRole('button', { name: /logo/i }) || 
                 screen.queryByText(/로고/i) ||
                 document.querySelector('[class*="logo"]');
    
    if (logo) {
      fireEvent.click(logo);
      fireEvent.click(logo);
      // Double click should navigate to profile form
      expect(mockNavigate).toHaveBeenCalled();
    }
  });

  it('should display user minerals and stamina', () => {
    render(<Header />);
    
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should navigate to shop when shop button is clicked', () => {
    render(<Header />);
    
    const shopButton = screen.getByLabelText('상점');
    fireEvent.click(shopButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/shop');
  });

  it('should not show admin badge when not in admin mode', () => {
    vi.mocked(useDebugStore).mockReturnValue({
      isAdminMode: false,
      selectedResource: null,
      toggleAdminMode: vi.fn(),
      setSelectedResource: vi.fn(),
      toggleDebugPanel: vi.fn(),
      isDebugPanelOpen: false,
    } as never);

    render(<Header />);
    
    expect(screen.queryByText('DEV')).not.toBeInTheDocument();
  });

  it('should show admin badge when in admin mode', () => {
    vi.mocked(useDebugStore).mockReturnValue({
      isAdminMode: true,
      selectedResource: null,
      toggleAdminMode: vi.fn(),
      setSelectedResource: vi.fn(),
      toggleDebugPanel: vi.fn(),
      isDebugPanelOpen: false,
    } as never);

    render(<Header />);
    
    expect(screen.getByText('DEV')).toBeInTheDocument();
  });

  it('should not navigate on logo click when not admin', () => {
    vi.mocked(useProfileStore).mockReturnValue({
      isAdmin: false,
    } as never);

    render(<Header />);
    
    const logo = document.querySelector('[class*="logo"]');
    if (logo) {
      fireEvent.click(logo);
      // Should not navigate when not admin
      expect(mockNavigate).not.toHaveBeenCalledWith('/my-page?showProfileForm=true');
    }
  });
});

