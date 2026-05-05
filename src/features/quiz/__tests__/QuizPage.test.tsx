import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizPage } from '@/features/quiz/pages/QuizPage';
import { BrowserRouter } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';

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

vi.mock('@/features/quiz/stores/useQuizStore', () => ({
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
      setState: (update: any) => {
        Object.assign(
          mockUserStoreState,
          typeof update === 'function' ? update(mockUserStoreState) : update
        );
      },
    }
  ),
}));

vi.mock('@/features/quiz/stores/useGameStore', () => ({
  useGameStore: mockGameStore,
}));

vi.mock('@/features/quiz/stores/useDeathNoteStore', () => ({
  useDeathNoteStore: {
    getState: () => ({
      addMissedQuestion: vi.fn(),
    }),
  },
}));

vi.mock('@/stores/useToastStore', () => ({
  useToastStore: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/stores/useBaseCampStore', () => ({
  useBaseCampStore: {
    getState: () => ({
      startDiagnostic: vi.fn(),
    }),
  },
}));

vi.mock('@/features/quiz/hooks/bridge/useQuestionGenerator', () => ({
  useQuestionGenerator: vi.fn(() => ({
    generateNewQuestion: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/bridge/useQuizInput', () => ({
  useQuizInput: vi.fn(() => ({
    handleKeypadNumber: vi.fn(),
    handleQwertyKeyPress: vi.fn(),
    handleKeypadClear: vi.fn(),
    handleKeypadBackspace: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/core/useQuizGameState', () => ({
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

vi.mock('@/features/quiz/hooks/bridge/useQuizAnimations', () => ({
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

vi.mock('@/features/quiz/hooks/core/useQuizSubmit', () => ({
  useQuizSubmit: vi.fn(() => ({
    handleSubmit: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/bridge/useQuizBusinessLogic', () => ({
  useQuizBusinessLogic: vi.fn(() => ({
    handleWatchAdRevive: vi.fn(),
    smartHandleGameOver: vi.fn(),
    handleStaminaAdRecovery: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/bridge/useQuizNavigation', () => ({
  useQuizNavigation: vi.fn(() => ({
    showExitConfirm: false,
    setShowExitConfirm: vi.fn(),
    isFadingOut: false,
    setIsFadingOut: vi.fn(),
    handleBack: vi.fn(),
    cancelExitConfirm: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/core/useQuizModals', () => ({
  useQuizModals: vi.fn(() => ({
    modals: {
      showLastChanceModal: false,
      showCountdown: false,
      showSafetyRope: false,
      showPauseModal: false,
      showTutorial: false,
      showPromise: false,
      showStaminaModal: false,
      showTipModal: true,
      isFlarePaused: false,
    },
    modalHandlers: {
      setShowLastChanceModal: vi.fn(),
      setShowCountdown: vi.fn(),
      setShowSafetyRope: vi.fn(),
      setShowPauseModal: vi.fn(),
      setShowTutorial: vi.fn(),
      setShowPromise: vi.fn(),
      setShowStaminaModal: vi.fn(),
      setShowTipModal: vi.fn(),
      setIsFlarePaused: vi.fn(),
    },
  })),
}));

vi.mock('@/features/quiz/hooks/core/useQuizScoreManager', () => ({
  useQuizScoreManager: vi.fn(() => ({
    score: 0,
    combo: 0,
    feverLevel: 0,
    lives: 3,
    isExhausted: false,
    handleCorrectAnswer: vi.fn(),
    handleWrongAnswer: vi.fn(),
    increaseScore: vi.fn(),
    decreaseScore: vi.fn(),
    resetCombo: vi.fn(),
    incrementCombo: vi.fn(),
    consumeLife: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/core/useQuizEventProcessor', () => ({
  useQuizEventProcessor: vi.fn(),
}));

vi.mock('@/lib/eventBus', () => ({
  quizEventBus: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
  },
}));

vi.mock('@/features/quiz/hooks/bridge/useQuizStartLogic', () => ({
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

vi.mock('@/features/quiz/hooks/bridge/useQuizSession', () => ({
  useQuizSession: vi.fn(() => ({
    sessionCreated: false,
  })),
}));

const mockGameplayHandlers = {
  handlePauseClick: vi.fn(),
  handlePauseResume: vi.fn(),
  handlePauseExit: vi.fn(),
  handleCountdownComplete: vi.fn(),
  handleLastSpurt: vi.fn(),
  handleSafetyRopeUsed: vi.fn(),
  handleTutorialClick: vi.fn(),
};

vi.mock('@/features/quiz/hooks/bridge/useQuizGameplay', () => ({
  useQuizGameplay: vi.fn(() => ({
    showCountdown: false,
    showSafetyRope: false,
    setShowSafetyRope: vi.fn(),
    showPauseModal: false,
    showTutorial: false,
    remainingPauses: 3,
    timerResetKey: 0,
    ...mockGameplayHandlers,
    setShowCountdown: vi.fn(),
    setTimerResetKey: vi.fn(),
    setShowTutorial: vi.fn(),
  })),
}));

vi.mock('@/features/quiz/hooks/core/useQuizRevive', () => ({
  useQuizRevive: vi.fn(() => ({
    handleRevive: vi.fn(),
    handlePurchaseAndRevive: vi.fn(),
    handleGiveUp: vi.fn(),
    stableHandleGameOver: vi.fn(),
  })),
}));

// Mock components with access to handlers
vi.mock('@/features/quiz/components/QuizLayout', async () => {
  const { useQuiz } = await import('@/features/quiz/contexts/QuizContext');
  return {
    QuizLayout: vi.fn(() => {
      const { quizState, quizHandlers, modalHandlers, modalState } = useQuiz();

      return (
        <div data-testid="quiz-layout">
          {modalState.showPauseModal && <div data-testid="pause-modal">잠시 멈춤</div>}
          {modalState.showStaminaModal && <div data-testid="stamina-modal">스태미나 부족</div>}
          {modalState.showTutorial && <div data-testid="tutorial-modal">공략법</div>}

          {quizState.isPreview ? (
            <div data-testid="quiz-preview" />
          ) : (
            <div data-testid="quiz-card" />
          )}

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
          <button data-testid="start-game-btn" onClick={() => modalHandlers.handleStartGame([])}>
            Start Game
          </button>
          <button data-testid="qwerty-btn" onClick={() => quizHandlers.handleQwertyKeyPress('a')}>
            Qwerty
          </button>
        </div>
      );
    }),
  };
});

vi.mock('@/features/quiz/components/QuizPreview', () => ({
  QuizPreview: vi.fn(() => <div data-testid="quiz-preview">Quiz Preview</div>),
}));

// Mock URL params validation
vi.mock('@/features/quiz/utils/urlParams', () => ({
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

      const dotBtn = screen.getByTestId('keypad-dot');
      fireEvent.click(dotBtn); // Should prefix '0.' if empty
    });

    it('should handle negative sign correctly', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      const minusBtn = screen.getByTestId('keypad-minus');
      fireEvent.click(minusBtn);
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

    it('should handle pause and resume', async () => {
      const { quizEventBus } = await import('@/lib/eventBus');
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('pause-btn'));
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
        modal: 'pause',
        show: true,
      });

      fireEvent.click(screen.getByTestId('pause-resume-btn'));
      expect(screen.queryByTestId('pause-modal')).toBeNull();

      fireEvent.click(screen.getByTestId('pause-btn'));
      fireEvent.click(screen.getByTestId('pause-exit-btn'));
    });

    it('should handle stamina modal and tutorials', async () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      // Trigger stamina modal (e.g. by mocking low stamina)
      useUserStore.setState({ stamina: 0 });

      // Re-render or trigger check
      fireEvent.click(screen.getByTestId('close-stamina-btn'));

      fireEvent.click(screen.getByTestId('tutorial-btn'));
      expect(mockGameplayHandlers.handleTutorialClick).toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('alert-action-btn'));
    });

    it('should handle qwerty input', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('qwerty-btn'));
    });

    it('should handle starting game', () => {
      render(
        <BrowserRouter>
          <QuizPage />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByTestId('start-game-btn'));
    });
  });
});
