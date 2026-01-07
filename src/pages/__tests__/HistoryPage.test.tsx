import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { HistoryPage } from '../HistoryPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/Header', () => ({
  Header: () => <div>Header</div>,
}));
vi.mock('../components/FooterNav', () => ({
  FooterNav: () => <div>Footer</div>,
}));

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}));

vi.mock('../utils/safeJsonParse', () => ({
  parseLocalSession: vi.fn(() => null),
}));

vi.mock('../utils/storage', () => ({
  storage: {
    getString: vi.fn(() => null),
  },
  StorageKeys: {
    LOCAL_SESSION: 'solve-climb-local-session',
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { container } = render(
      <BrowserRouter>
        <HistoryPage />
      </BrowserRouter>
    );

    await waitFor(
      () => {
        expect(container).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});
