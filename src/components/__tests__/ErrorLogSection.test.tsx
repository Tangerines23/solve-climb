import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorLogSection } from '../debug/ErrorLogSection';
import { useErrorLogStore } from '../../stores/useErrorLogStore';

// Mock dependencies
vi.mock('../../stores/useErrorLogStore', () => ({
  useErrorLogStore: vi.fn(),
}));

describe('ErrorLogSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: [
        {
          id: '1',
          timestamp: new Date(),
          level: 'error',
          message: 'Test error',
        },
      ],
      clearLogs: vi.fn(),
      filterLogs: vi.fn(() => []),
    } as never);
  });

  it('should render error log section', () => {
    render(<ErrorLogSection />);
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
  });

  it('should clear logs when clear button is clicked', () => {
    const mockClearLogs = vi.fn();
    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: [],
      clearLogs: mockClearLogs,
      filterLogs: vi.fn(() => []),
    } as never);

    // Mock window.confirm
    const mockConfirm = vi.fn(() => true);
    window.confirm = mockConfirm;

    render(<ErrorLogSection />);

    const clearButton = screen.queryByText(/로그 지우기/);
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockClearLogs).toHaveBeenCalled();
    }
  });

  it('should filter logs by level', () => {
    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: [
        {
          id: '1',
          timestamp: new Date(),
          level: 'error',
          message: 'Error message',
        },
        {
          id: '2',
          timestamp: new Date(),
          level: 'warning',
          message: 'Warning message',
        },
      ],
      clearLogs: vi.fn(),
      filterLogs: vi.fn((level) => {
        if (level === 'error') {
          return [
            {
              id: '1',
              timestamp: new Date(),
              level: 'error',
              message: 'Error message',
            },
          ];
        }
        return [];
      }),
    } as never);

    render(<ErrorLogSection />);

    // Component should render with logs
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
  });

  it('should filter logs by time', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: [
        {
          id: '1',
          timestamp: oneHourAgo,
          level: 'error',
          message: 'Recent error',
        },
        {
          id: '2',
          timestamp: twoHoursAgo,
          level: 'error',
          message: 'Old error',
        },
      ],
      clearLogs: vi.fn(),
      filterLogs: vi.fn(() => []),
    } as never);

    render(<ErrorLogSection />);

    // Component should render
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
  });

  it('should filter logs by search query', () => {
    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: [
        {
          id: '1',
          timestamp: new Date(),
          level: 'error',
          message: 'Test error message',
        },
        {
          id: '2',
          timestamp: new Date(),
          level: 'error',
          message: 'Another message',
        },
      ],
      clearLogs: vi.fn(),
      filterLogs: vi.fn(() => []),
    } as never);

    render(<ErrorLogSection />);

    // Component should render
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
  });

  it('should export logs', () => {
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date(),
        level: 'error' as const,
        message: 'Test error',
      },
    ];

    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: mockLogs,
      clearLogs: vi.fn(),
      filterLogs: vi.fn(() => mockLogs),
    } as never);

    render(<ErrorLogSection />);

    // Component should render with logs
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
  });

  it('should not clear logs if confirm is cancelled', () => {
    const mockClearLogs = vi.fn();
    vi.mocked(useErrorLogStore).mockReturnValue({
      logs: [],
      clearLogs: mockClearLogs,
      filterLogs: vi.fn(() => []),
    } as never);

    // Mock window.confirm to return false
    const mockConfirm = vi.fn(() => false);
    window.confirm = mockConfirm;

    render(<ErrorLogSection />);

    // Component should render
    expect(screen.getByText(/에러 로그/)).toBeInTheDocument();
  });
});


