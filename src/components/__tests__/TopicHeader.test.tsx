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

  const renderTopicHeader = (categoryId: string | null) => {
    return render(
      <BrowserRouter>
        <TopicHeader categoryId={categoryId} />
      </BrowserRouter>
    );
  };

  it('should render default title when categoryId is null', () => {
    renderTopicHeader(null);
    expect(screen.getByText('주제 선택')).toBeInTheDocument();
  });

  it('should render category name when categoryId is provided', () => {
    renderTopicHeader('math');
    // Category name should be rendered (could be '수학' or other name from APP_CONFIG)
    const header = screen.getByRole('heading');
    expect(header).toBeInTheDocument();
    expect(header.textContent).toBeTruthy();
  });

  it('should navigate to home when back button is clicked', () => {
    renderTopicHeader('math');
    const backButton = screen.getByLabelText('뒤로 가기');
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should render back button', () => {
    renderTopicHeader('math');
    expect(screen.getByLabelText('뒤로 가기')).toBeInTheDocument();
  });

  it('should render default title when categoryId does not exist', () => {
    renderTopicHeader('nonexistent');
    expect(screen.getByText('주제 선택')).toBeInTheDocument();
  });

  it('should render category name correctly for valid categoryId', () => {
    renderTopicHeader('math');
    const title = screen.getByRole('heading');
    expect(title).toBeInTheDocument();
    expect(title.textContent).not.toBe('주제 선택');
  });

  it('should call navigate with correct path when back button is clicked', () => {
    renderTopicHeader('math');
    const backButton = screen.getByLabelText('뒤로 가기');
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should render header with correct structure', () => {
    const { container } = renderTopicHeader('math');
    const header = container.querySelector('.topic-header');
    expect(header).toBeInTheDocument();
  });
});

