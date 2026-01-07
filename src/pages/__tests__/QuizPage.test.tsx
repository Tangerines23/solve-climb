import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QuizPage } from '../QuizPage';
import { BrowserRouter } from 'react-router-dom';

// Mock all dependencies
vi.mock('../stores/useQuizStore');
vi.mock('../stores/useSettingsStore');
vi.mock('../stores/useUserStore');
vi.mock('../stores/useGameStore');
vi.mock('../stores/useDebugStore');
vi.mock('../hooks/useQuestionGenerator');
vi.mock('../hooks/useQuizInput');
vi.mock('../hooks/useQuizGameState');
vi.mock('../hooks/useQuizAnimations');
vi.mock('../hooks/useQuizSubmit');
vi.mock('../components/QuizCard');
vi.mock('../components/GameTipModal');
vi.mock('../components/CustomKeypad');
vi.mock('../components/QwertyKeypad');
vi.mock('../components/game/GameOverlay');
vi.mock('../components/game/StaminaWarningModal');
vi.mock('../components/game/ItemFeedbackOverlay');
vi.mock('../components/LastChanceModal');
vi.mock('../components/CountdownOverlay');
vi.mock('../components/game/SafetyRopeOverlay');
vi.mock('../utils/storage');
vi.mock('../utils/supabaseClient');
vi.mock('../utils/urlParams');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

describe('QuizPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

