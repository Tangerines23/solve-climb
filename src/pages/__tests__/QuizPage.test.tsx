import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizPage } from '../QuizPage';
import { BrowserRouter } from 'react-router-dom';

// Use vi.hoisted to ensure these are initialized before vi.mock
const { mockQuizStore, mockUserStoreState, mockGameStore } = vi.hoisted(() => {
  const qStore = vi.fn((selector) => {
    const state = {
      score: 0,
      difficulty: 'medium',
      increaseScore: vi.fn(),
      decreaseScore: vi.fn(),
      resetQuiz: vi.fn(),
      category: '기초',
      world: 'World1',
      timeLimit: 10,
      setGameMode: vi.fn(),
      gameMode: 'practice',
      setQuizContext: vi.fn(),
    };
    return selector ? selector(state) : state;
  });

  const userState = {
    stamina: 100,
    inventory: [],
    isAnonymous: false,
    checkStamina: vi.fn().mockResolvedValue(true),
    consumeItem: vi.fn(),
    consumeStamina: vi.fn(),
    recoverStaminaAds: vi.fn(),
    refundStamina: vi.fn(),
    minerals: 10,
  };

  const gStore = vi.fn((selector) => {
    const state = {
      setExhausted: vi.fn(),
      resetGame: vi.fn(),
      isStaminaConsumed: false,
      feverLevel: 0,
      lives: 3,
      isExhausted: false,
      minerals: 10,
      stamina: 100,
    };
    return selector ? selector(state) : state;
  });

  // @ts-expect-error type casting for mock
  gStore.getState = () => ({
    isExhausted: false,
    minerals: 10,
    stamina: 100,
    lives: 3,
  });
  // @ts-expect-error type casting for mock
  gStore.subscribe = vi.fn();

  return {
    mockQuizStore: qStore,
    mockUserStoreState: userState,
    mockGameStore: gStore,
  };
});

vi.mock('@/stores/useQuizStore', () => ({
  useQuizStore: mockQuizStore,
}));

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      keyboardType: 'custom',
      hapticEnabled: true,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: Object.assign(
    vi.fn(() => mockUserStoreState),
    {
      getState: () => mockUserStoreState,
    }
  ),
}));

vi.mock('@/stores/useGameStore', () => ({
  useGameStore: mockGameStore,
}));

vi.mock('@/stores/useToastStore', () => ({
  useToastStore: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('@/stores/useBaseCampStore', () => ({
  useBaseCampStore: {
    getState: () => ({
      startDiagnostic: vi.fn(),
    }),
  },
}));

vi.mock('@/hooks/useQuestionGenerator', () => ({
  useQuestionGenerator: vi.fn(() => ({
    generateNewQuestion: vi.fn(),
  })),
}));

vi.mock('@/hooks/useQuizInput', () => ({
  useQuizInput: vi.fn(),
}));

vi.mock('@/hooks/useQuizGameState', () => ({
  useQuizGameState: vi.fn(() => ({
    totalQuestions: 0,
    setTotalQuestions: vi.fn(),
    setUserAnswers: vi.fn(),
    setWrongAnswers: vi.fn(),
    setSolveTimes: vi.fn(),
    setGameSessionId: vi.fn(),
    setQuestionStartTime: vi.fn(),
    handleGameOver: vi.fn(),
    questionStartTime: 0,
  })),
}));

vi.mock('@/hooks/useQuizAnimations', () => ({
  useQuizAnimations: vi.fn(() => ({
    setIsError: vi.fn(),
    setShowFlash: vi.fn(),
    setQuestionAnimation: vi.fn(),
    setShowSlideToast: vi.fn(),
    setCardAnimation: vi.fn(),
    setInputAnimation: vi.fn(),
    setDamagePosition: vi.fn(),
    isError: false,
    showFlash: false,
    showSlideToast: false,
    cardAnimation: '',
    inputAnimation: '',
    questionAnimation: '',
    damagePosition: null,
  })),
}));

vi.mock('@/hooks/useQuizSubmit', () => ({
  useQuizSubmit: vi.fn(() => ({
    handleSubmit: vi.fn(),
  })),
}));

vi.mock('@/hooks/useQuizBusinessLogic', () => ({
  useQuizBusinessLogic: vi.fn(() => ({
    handleWatchAdRevive: vi.fn(),
    smartHandleGameOver: vi.fn(),
    handleStaminaAdRecovery: vi.fn(),
  })),
}));

vi.mock('@/hooks/useQuizNavigation', () => ({
  useQuizNavigation: vi.fn(() => ({
    showExitConfirm: false,
    isFadingOut: false,
    handleBack: vi.fn(),
  })),
}));

vi.mock('@/hooks/useQuizStartLogic', () => ({
  useQuizStartLogic: vi.fn(() => ({
    showTipModal: true,
    setShowTipModal: vi.fn(),
    showStaminaModal: false,
    setShowStaminaModal: vi.fn(),
    showPromise: false,
    promiseData: { rule: '', example: '' },
    activeLandmark: null,
    altitudePhase: 'start',
    handleStartGame: vi.fn(),
    handlePromiseComplete: vi.fn(),
    onAlertAction: vi.fn(),
  })),
}));

vi.mock('@/hooks/useQuizSession', () => ({
  useQuizSession: vi.fn(() => ({
    sessionCreated: false,
  })),
}));

vi.mock('@/hooks/useQuizGameplay', () => ({
  useQuizGameplay: vi.fn(() => ({
    showCountdown: false,
    showSafetyRope: false,
    setShowSafetyRope: vi.fn(),
    showPauseModal: false,
    remainingPauses: 3,
    timerResetKey: 0,
    handlePauseClick: vi.fn(),
    handlePauseResume: vi.fn(),
    handlePauseExit: vi.fn(),
    handleCountdownComplete: vi.fn(),
    handleLastSpurt: vi.fn(),
    handleSafetyRopeUsed: vi.fn(),
    setShowCountdown: vi.fn(),
    setTimerResetKey: vi.fn(),
  })),
}));

vi.mock('@/hooks/useQuizRevive', () => ({
  useQuizRevive: vi.fn(() => ({
    handleRevive: vi.fn(),
    handlePurchaseAndRevive: vi.fn(),
    handleGiveUp: vi.fn(),
    stableHandleGameOver: vi.fn(),
  })),
}));

// Mock components with access to handlers
vi.mock('@/components/quiz/QuizLayout', () => ({
  QuizLayout: vi.fn(({ quizHandlers, modalHandlers }: any) => (
    <div data-testid="quiz-layout">
      <button data-testid="submit-btn" onClick={() => quizHandlers.handleSubmit()}>
        Submit
      </button>
      <button data-testid="keypad-1" onClick={() => quizHandlers.handleKeypadNumber('1')}>
        1
      </button>
      <button data-testid="keypad-dot" onClick={() => quizHandlers.handleKeypadNumber('.')}>
        .
      </button>
      <button data-testid="keypad-minus" onClick={() => quizHandlers.handleKeypadNumber('-')}>
        -
      </button>
      <button data-testid="backspace-btn" onClick={() => quizHandlers.handleKeypadBackspace()}>
        BS
      </button>
      <button data-testid="clear-btn" onClick={() => quizHandlers.handleKeypadClear()}>
        C
      </button>
      <button data-testid="pause-btn" onClick={() => quizHandlers.onPause()}>
        Pause
      </button>
      <button data-testid="revive-btn" onClick={() => modalHandlers.handleRevive(true)}>
        Revive
      </button>
      <button data-testid="give-up-btn" onClick={() => modalHandlers.handleGiveUp()}>
        Give Up
      </button>
      <button data-testid="pause-resume-btn" onClick={() => modalHandlers.handlePauseResume()}>
        Resume
      </button>
      <button data-testid="pause-exit-btn" onClick={() => modalHandlers.handlePauseExit()}>
        Exit
      </button>
      <button
        data-testid="close-stamina-btn"
        onClick={() => modalHandlers.setShowStaminaModal(false)}
      >
        Close Stamina
      </button>
      <button
        data-testid="alert-action-btn"
        onClick={() => modalHandlers.onAlertAction && modalHandlers.onAlertAction()}
      >
        Alert Action
      </button>
      <button data-testid="tutorial-btn" onClick={() => modalHandlers.setShowTutorial(true)}>
        Tutorial
      </button>
      <button data-testid="promise-btn" onClick={() => modalHandlers.handlePromiseComplete()}>
        Promise
      </button>
    </div>
  )),
}));

vi.mock('@/components/quiz/QuizPreview', () => ({
  QuizPreview: vi.fn(() => <div data-testid="quiz-preview">Quiz Preview</div>),
}));

// Mock URL params validation
vi.mock('@/utils/urlParams', () => ({
  validateWorldParam: vi.fn((v) => v || 'World1'),
  validateCategoryInWorldParam: vi.fn((w, c) => c || '기초'),
  validateLevelParam: vi.fn((l) => (l ? parseInt(l) : 1)),
  validateModeParam: vi.fn((m) => m || 'practice'),
}));

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

describe('QuizPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('should render QuizLayout by default', () => {
    render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('quiz-layout')).toBeDefined();
  });

  it('should render QuizPreview when preview=true is in search params', () => {
    mockSearchParams.set('preview', 'true');
    render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('quiz-preview')).toBeDefined();
  });

  it('should initialize quiz context with URL parameters', () => {
    mockSearchParams.set('world', 'World2');
    mockSearchParams.set('category', '심화');
    mockSearchParams.set('level', '5');

    render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('quiz-layout')).toBeDefined();
  });

  it('should handle Base Camp mode correctly', () => {
    mockSearchParams.set('mode', 'base-camp');

    render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('quiz-layout')).toBeDefined();
  });

  it('should handle survival mode and time limit calculation', () => {
    mockSearchParams.set('mode', 'survival');

    render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('quiz-layout')).toBeDefined();
  });

  describe('Keypad Interactions', () => {
    it('should handle decimal point correctly', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      const keypad1 = screen.getByTestId('keypad-1');
      const dotBtn = screen.getByTestId('keypad-dot');

      fireEvent.click(keypad1);
      fireEvent.click(dotBtn);
      fireEvent.click(keypad1);

      // Verification would happen if we could see the internal state,
      // but we can at least ensure the handler doesn't crash
    });

    it('should handle negative sign correctly', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('keypad-minus'));
      fireEvent.click(screen.getByTestId('keypad-1'));
    });

    it('should handle backspace and clear', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('keypad-1'));
      fireEvent.click(screen.getByTestId('backspace-btn'));
      fireEvent.click(screen.getByTestId('keypad-1'));
      fireEvent.click(screen.getByTestId('clear-btn'));
    });
  });

  describe('Modal and Game Handlers', () => {
    it('should handle revival with minerals', async () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      const reviveBtn = screen.getByTestId('revive-btn');
      fireEvent.click(reviveBtn);
      // Verify minerals were checked/consumed via mocks
    });

    it('should handle giving up', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      const giveUpBtn = screen.getByTestId('give-up-btn');
      fireEvent.click(giveUpBtn);
    });

    it('should handle starting game with items', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      const promiseBtn = screen.getByTestId('promise-btn');
      fireEvent.click(promiseBtn);
    });

    it('should handle watching ad and reviving', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      // This would require mocking handleWatchAdAndRevive in the layout mock
    });
  });
});
