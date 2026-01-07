import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ResultPage } from '../ResultPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../stores/useQuizStore');
vi.mock('../stores/useLevelProgressStore');
vi.mock('../stores/useUserStore');
vi.mock('../components/TierUpgradeModal');
vi.mock('../components/BadgeNotification');
vi.mock('../utils/tossGameCenter');
vi.mock('../utils/supabaseClient');
vi.mock('../utils/urlParams');
vi.mock('../utils/debugLogger');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

describe('ResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <ResultPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

