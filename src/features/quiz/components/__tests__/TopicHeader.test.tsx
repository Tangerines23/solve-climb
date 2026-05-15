import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TopicHeader } from '../TopicHeader';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TopicHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTopicHeader = (title: string, onBack?: () => void) => {
    return render(
      <BrowserRouter>
        <TopicHeader title={title} onBack={onBack} />
      </BrowserRouter>
    );
  };

  it('should render title correctly', () => {
    renderTopicHeader('테스트 제목');
    expect(screen.getByText('테스트 제목')).toBeInTheDocument();
  });

  it('should navigate back when back button is clicked and no onBack provided', () => {
    renderTopicHeader('테스트 제목');
    const backButton = screen.getByLabelText('뒤로 가기');
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should call onBack when back button is clicked and onBack is provided', () => {
    const mockOnBack = vi.fn();
    renderTopicHeader('테스트 제목', mockOnBack);

    const backButton = screen.getByLabelText('뒤로 가기');
    backButton.click();

    expect(mockOnBack).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should render header with correct structure', () => {
    const { container } = renderTopicHeader('테스트 제목');
    const header = container.querySelector('.topic-header');
    expect(header).toBeInTheDocument();
  });
});
