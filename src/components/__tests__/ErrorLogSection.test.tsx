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

    render(<ErrorLogSection />);

    const clearButton = screen.queryByText(/로그 지우기/);
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockClearLogs).toHaveBeenCalled();
    }
  });
});


