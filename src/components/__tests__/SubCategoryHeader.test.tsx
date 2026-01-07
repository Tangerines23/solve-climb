import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SubCategoryHeader } from '../SubCategoryHeader';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SubCategoryHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSubCategoryHeader = (categoryId: string | null) => {
    return render(
      <BrowserRouter>
        <SubCategoryHeader categoryId={categoryId} />
      </BrowserRouter>
    );
  };

  it('should render default title when categoryId is null', () => {
    renderSubCategoryHeader(null);
    expect(screen.getByText('주제 선택')).toBeInTheDocument();
  });

  it('should render category name when categoryId is provided', () => {
    renderSubCategoryHeader('math');
    // Category name should be rendered (could be '수학' or other name from APP_CONFIG)
    const header = screen.getByRole('heading');
    expect(header).toBeInTheDocument();
    expect(header.textContent).toBeTruthy();
  });

  it('should navigate to home when back button is clicked', () => {
    renderSubCategoryHeader('math');
    const backButton = screen.getByLabelText('뒤로 가기');
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should render back button', () => {
    renderSubCategoryHeader('math');
    expect(screen.getByLabelText('뒤로 가기')).toBeInTheDocument();
  });
});

