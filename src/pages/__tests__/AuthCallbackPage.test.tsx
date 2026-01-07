import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AuthCallbackPage } from '../AuthCallbackPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../utils/supabaseClient');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthCallbackPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

