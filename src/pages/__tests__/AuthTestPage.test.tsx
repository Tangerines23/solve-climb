import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AuthTestPage } from '../AuthTestPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../utils/authTest');
vi.mock('../utils/env');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('AuthTestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthTestPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

