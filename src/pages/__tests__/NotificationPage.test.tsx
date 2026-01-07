import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { NotificationPage } from '../NotificationPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/Header');
vi.mock('../components/FooterNav');
vi.mock('../components/UnderDevelopmentModal');
vi.mock('../components/Toast');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('NotificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <NotificationPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

