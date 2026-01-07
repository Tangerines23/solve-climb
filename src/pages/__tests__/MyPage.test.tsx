import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MyPage } from '../MyPage';
import { BrowserRouter } from 'react-router-dom';

// Mock all dependencies
vi.mock('../components/Header');
vi.mock('../components/FooterNav');
vi.mock('../components/ProfileForm');
vi.mock('../components/DataResetConfirmModal');
vi.mock('../components/Toast');
vi.mock('../components/AlertModal');
vi.mock('../components/TierBadge');
vi.mock('../components/TierProgressBar');
vi.mock('../components/CyclePromotionModal');
vi.mock('../components/BadgeSlot');
vi.mock('../stores/useProfileStore');
vi.mock('../stores/useSettingsStore');
vi.mock('../stores/useFavoriteStore');
vi.mock('../stores/useQuizStore');
vi.mock('../hooks/useMyPageStats');
vi.mock('../utils/challenge');
vi.mock('../utils/dataReset');
vi.mock('../utils/haptic');
vi.mock('../utils/supabaseClient');
vi.mock('../utils/tossGameCenter');
vi.mock('../utils/tossLogin');
vi.mock('../utils/tossAuth');
vi.mock('../utils/tossGameLogin');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

describe('MyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <MyPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

