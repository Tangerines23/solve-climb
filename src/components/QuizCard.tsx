// 퀴즈 카드 컴포넌트
import React, { FormEvent, useMemo } from 'react';
import { QuizQuestion } from '../types/quiz';
import { GameMode } from '../types/quiz';
import { TimerCircle } from './TimerCircle';
import { QwertyKeypad } from './QwertyKeypad';
import { CustomKeypad } from './CustomKeypad';
import { APP_CONFIG } from '../config/app';
import { SURVIVAL_CONFIG } from '../constants/game';
import { getItemEmoji } from '../constants/items';
import { useGameStore } from '../stores/useGameStore';
import { sendDebugLog } from '../utils/debugLogger';

interface QuizCardProps {
  // 문제 관련
  currentQuestion: QuizQuestion | null;
  answerInput: string;
  displayValue: string;

  // 카테고리/토픽 정보
  category: string | null;
  topic: string | null;
  categoryParam: string | null;
  subParam: string | null;
  levelParam: number | null;

  // 게임 모드
  gameMode: GameMode;
  timeLimit: number;
  questionKey: number;
  timerResetKey?: number;
  SURVIVAL_QUESTION_TIME: number;
  totalQuestions: number; // 현재 푼 문제 수
  lives: number; // 현재 라이프
  onSafetyRopeUsed?: () => void;

  // Pause Props
  onPause: () => void;
  // remainingPauses removed

  // 상태
  isSubmitting: boolean;
  isError: boolean;
  useSystemKeyboard: boolean;
  showTipModal: boolean;
  isPaused: boolean; // Timer pause (global)
  isInputPaused?: boolean; // Input specific pause (defaults to isPaused if undefined)
  showExitConfirm: boolean;
  isFadingOut: boolean;
  showAnswer?: boolean; // 디버그 모드: 정답 표시

  // 애니메이션
  cardAnimation: string;
  inputAnimation: string;
  questionAnimation: string;
  showFlash: boolean;
  showSlideToast: boolean;
  toastValue: string; // "+10m" 또는 "-3m"
  damagePosition: { left: string; top: string };

  // 핸들러
  generateNewQuestion: () => void;
  handleSubmit: (e: FormEvent) => void;
  // handleBack removed
  handleGameOver: () => void;
  handleKeypadNumber: (num: string) => void;
  handleQwertyKeyPress: (key: string) => void;
  handleKeypadClear: () => void;
  handleKeypadBackspace: () => void;

  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>;
  exitConfirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;

  // Setters
  setAnswerInput: (value: string) => void;
  setDisplayValue: (value: string) => void;
  setShowExitConfirm: (value: boolean) => void;
  setIsFadingOut: (value: boolean) => void;
}

function QuizCardComponent({
  currentQuestion,
  answerInput,
  displayValue,
  category,
  topic,
  categoryParam,
  subParam,
  levelParam,
  gameMode,
  timeLimit,
  questionKey,
  timerResetKey,
  SURVIVAL_QUESTION_TIME,
  totalQuestions,
  lives,
  isSubmitting,
  isError,
  useSystemKeyboard,
  showTipModal,
  isPaused,
  isInputPaused, // New prop
  showExitConfirm,
  isFadingOut,
  generateNewQuestion,
  showAnswer = false,
  cardAnimation,
  inputAnimation,
  questionAnimation,
  showFlash,
  showSlideToast,
  damagePosition,
  handleSubmit,
  handleGameOver,
  handleKeypadNumber,
  handleQwertyKeyPress,
  handleKeypadClear,
  handleKeypadBackspace,
  inputRef,
  exitConfirmTimeoutRef,
  setAnswerInput,
  setDisplayValue,
  setShowExitConfirm,
  setIsFadingOut,
  onSafetyRopeUsed,
  toastValue,
  onPause,
}: QuizCardProps) {
  // #region agent log
  const renderId = Math.random().toString(36).substring(7);
  sendDebugLog('QuizCard.tsx:108', 'QuizCard component entry', {
    renderId,
    showTipModal,
    isPaused,
    hasCurrentQuestion: !!currentQuestion,
  });
  // #endregion

  // Determine effective input pause state
  const effectiveInputPaused = isInputPaused !== undefined ? isInputPaused : isPaused;

  // URL 파라미터가 있으면 그것을 우선 사용, 없으면 store에서 가져오기
  const displayCategory = useMemo(() => {
    return categoryParam
      ? APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] || category
      : category;
  }, [categoryParam, category]);

  const displayTopic = useMemo(() => {
    if (!categoryParam || !subParam) {
      return topic;
    }

    if (subParam === 'arithmetic' && levelParam !== null) {
      const level = levelParam;
      const topicMap: Record<number, string> = {
        1: '덧셈',
        2: '뺄셈',
        3: '덧셈',
        4: '뺄셈',
        5: '곱셈',
        6: '나눗셈',
        7: '혼합 연산',
        8: '곱셈',
        9: '나눗셈',
        10: '종합 연산',
      };
      return topicMap[level] || '덧셈';
    } else if (subParam === 'calculus' && levelParam !== null) {
      const level = levelParam;
      const topicMap: Record<number, string> = {
        1: '기초 미분',
        2: '상수배 미분',
        3: '합과 차의 미분',
        4: '곱의 미분',
        5: '몫의 미분',
        6: '합성함수 미분',
        7: '삼각함수 미분',
        8: '지수·로그 미분',
        9: '고급 미분',
        10: '미분 종합',
      };
      return topicMap[level] || '미적분';
    } else {
      const subTopics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
      const subTopicInfo = subTopics?.find((t) => t.id === subParam);
      return subTopicInfo?.name || subParam;
    }
  }, [categoryParam, subParam, levelParam, topic]);

  const isJapaneseQuiz = useMemo(() => {
    return categoryParam === 'language' && subParam === 'japanese';
  }, [categoryParam, subParam]);

  const isEquationQuiz = useMemo(() => {
    return categoryParam === 'math' && subParam === 'equations';
  }, [categoryParam, subParam]);

  const isCalculusQuiz = useMemo(() => {
    return categoryParam === 'math' && subParam === 'calculus';
  }, [categoryParam, subParam]);

  const allowNegative = useMemo(() => {
    return isEquationQuiz || isCalculusQuiz;
  }, [isEquationQuiz, isCalculusQuiz]);

  const { activeItems, consumeActiveItem, consumeLife, isExhausted, usedItems } = useGameStore();

  const currentSurvivalDuration = useMemo(() => {
    if (gameMode !== 'survival') return SURVIVAL_QUESTION_TIME;

    const currentWave = totalQuestions + 1;
    const waveConfig = SURVIVAL_CONFIG.WAVES.find(
      (w) => currentWave >= w.start && currentWave <= w.end
    );

    // 기본 파동 타이머 (없으면 하드코어 7초)
    const baseTimer = waveConfig ? waveConfig.timer : 7;

    // v1.9 스마트 압박 (Smart Pressure) 적용
    // 공식: BaseTime * clamp(MIN, START - (totalQuestions * DECAY))
    const { START, MIN, DECAY } = SURVIVAL_CONFIG.PRESSURE_CONFIG.PRESSURE_FACTOR;
    const pressureMultiplier = Math.max(MIN, START - totalQuestions * DECAY);

    return Math.floor(baseTimer * pressureMultiplier);
  }, [gameMode, totalQuestions, SURVIVAL_QUESTION_TIME]);

  const isPositiveToast = useMemo(() => toastValue.startsWith('+'), [toastValue]);

  const forceSystemKeyboard = useMemo(() => {
    // 일반 상식 문제 중 정답이 텍스트인 경우 시스템 키보드 강제 사용 (한글 입력 지원)
    return categoryParam === 'general' && typeof currentQuestion?.answer === 'string';
  }, [categoryParam, currentQuestion]);

  const shouldUseSystemKeyboard = useSystemKeyboard || forceSystemKeyboard;

  // --- Early Returns must come AFTER all hooks ---

  // 팁 모달이 열려있으면 게임 화면 숨김 -> REMOVED to show background
  // if (showTipModal) {
  //   sendDebugLog('QuizCard.tsx:earlyReturn1', 'Early return: showTipModal=true', { renderId });
  //   return null;
  // }

  // 데이터 부족 시 로딩 반환
  if (!currentQuestion || (!displayCategory && !categoryParam) || (!displayTopic && !subParam)) {
    sendDebugLog('QuizCard.tsx:earlyReturn2', 'Early return: missing data', {
      renderId,
      hasCurrentQuestion: !!currentQuestion,
      displayCategory,
      displayTopic,
      categoryParam,
      subParam,
    });
    if (categoryParam && subParam) {
      return (
        <div className="quiz-page">
          <div className="quiz-loading">문제를 생성하는 중...</div>
        </div>
      );
    }
    return null;
  }

  const handleTimeUp = () => {
    const hasSafetyRope = activeItems.includes('safety_rope');
    const hasLastSpurt = gameMode === 'time-attack' && activeItems.includes('last_spurt');

    if (hasSafetyRope) {
      consumeActiveItem('safety_rope');
      console.log('[Game] Safety Rope used! Saved from time up.');
      if (onSafetyRopeUsed) onSafetyRopeUsed();
    } else if (hasLastSpurt) {
      handleGameOver();
    } else if (gameMode === 'survival') {
      const hasFlare = activeItems.includes('flare');
      if (hasFlare) {
        consumeActiveItem('flare');
        console.log('[Game] Flare used! Revived from time up.');
        generateNewQuestion();
      } else if (lives > 1) {
        consumeLife();
        generateNewQuestion();
      } else {
        consumeLife();
        handleGameOver();
      }
    } else {
      handleGameOver();
    }
  };

  return (
    <>
      {/* Header Area with new 3-Column Grid or Flex */}
      <header className="quiz-header-rework">
        {/* LEFT: Pause & Items */}
        <div className="header-left-controls">
          <button className="pause-button" onClick={onPause} aria-label="일시정지">
            <span className="pause-icon">||</span>
          </button>

          <div className="vertical-item-stack">
            {/* Active Items */}
            {activeItems.map((code, i) => (
              <div key={`active-${i}`} className="side-item active">
                {getItemEmoji(code)}
              </div>
            ))}
            {/* Used Items */}
            {usedItems.map((code, i) => (
              <div key={`used-${i}`} className="side-item used">
                {getItemEmoji(code)}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Timer Only */}
        <div className="header-center-timer">
          <div className="timer-wrapper">
            {gameMode === 'survival' ? (
              <TimerCircle
                duration={currentSurvivalDuration}
                onComplete={handleTimeUp}
                isPaused={isSubmitting || isPaused}
                key={questionKey}
              />
            ) : (
              <TimerCircle
                duration={timeLimit}
                onComplete={handleTimeUp}
                isPaused={isPaused}
                enableFastForward={true}
                key={`${timeLimit}-${timerResetKey || 0}`}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Score Display */}
        <div className="header-right-stats">
          <div className="score-display-round">
            <span className="score-val">{totalQuestions * 10}</span>
            <span className="score-unit">m</span>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="quiz-content">
        {/* 퀴즈 카드 */}
        <div className={`quiz-card ${cardAnimation}`}>
          <div className="category-label">
            {displayCategory} - {displayTopic}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isPaused || isSubmitting || isError) return;
              handleSubmit(e);
            }}
            style={{ display: 'contents' }}
          >
            <div className={questionAnimation}>
              <h2 className="problem-text">{currentQuestion.question}</h2>
              {showAnswer && (
                <div className="debug-answer-display">
                  정답: <strong>{currentQuestion.answer}</strong>
                </div>
              )}
            </div>
            {/* 답안 표시 영역 - 시스템 키보드 사용 시 input, 아니면 display */}
            {shouldUseSystemKeyboard ? (
              <>
                <div className={`answer-input-wrapper ${isError ? 'is-error' : ''}`}>
                  <input
                    ref={inputRef}
                    type={isJapaneseQuiz || forceSystemKeyboard ? 'text' : 'number'}
                    inputMode={isJapaneseQuiz ? 'text' : forceSystemKeyboard ? 'text' : 'numeric'}
                    value={isError ? displayValue : answerInput}
                    onChange={(e) => {
                      if (isError || isSubmitting || effectiveInputPaused) return; // Disable input on pause

                      const value = e.target.value;

                      if (isJapaneseQuiz) {
                        // 일본어: 영문자만 허용 (로마지)
                        const filtered = value.replace(/[^a-zA-Z]/g, '');
                        if (filtered.length <= 20) {
                          setAnswerInput(filtered);
                          setDisplayValue(filtered);
                        }
                      } else if (forceSystemKeyboard) {
                        // 상식(텍스트): 모든 입력 허용 (길이 제한만)
                        if (value.length <= 10) {
                          setAnswerInput(value);
                          setDisplayValue(value);
                        }
                      } else {
                        // 수학/논리/상식(숫자): 숫자 및 음수 처리
                        if (allowNegative) {
                          // 음수 기호와 숫자만 허용 (기존 로직 유지)
                          let newValue = value.replace(/[^0-9-]/g, '');
                          if (newValue.includes('-') && newValue.indexOf('-') !== 0) {
                            newValue = newValue.replace(/-/g, '');
                            newValue = '-' + newValue;
                          }
                          const minusCount = (newValue.match(/-/g) || []).length;
                          if (minusCount > 1) {
                            newValue = '-' + newValue.replace(/-/g, '');
                          }
                          if (newValue.length <= 6) {
                            setAnswerInput(newValue);
                            setDisplayValue(newValue);
                          }
                        } else {
                          // 일반 숫자: 숫자만 허용
                          const newValue = value.replace(/[^0-9]/g, '');
                          if (newValue.length <= 6) {
                            // 길이 제한 5->6으로 통일
                            setAnswerInput(newValue);
                            setDisplayValue(newValue);
                          }
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isError && !effectiveInputPaused && !isSubmitting) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    onClick={() => {
                      // 클릭 시 키보드 포커스 (에러 상태가 아닐 때만)
                      if (inputRef.current && !isSubmitting && !isError) {
                        inputRef.current.focus();
                      }
                    }}
                    placeholder={isJapaneseQuiz ? '로마지 입력 (예: a, ki)' : '정답 입력'}
                    className={`answer-input-system ${inputAnimation} ${isError ? 'error-state is-error' : ''} ${showFlash && !isExhausted ? 'input-error-flash' : ''}`}
                    disabled={(isSubmitting && !isError) || effectiveInputPaused}
                    readOnly={isError}
                    autoFocus={false}
                  />
                </div>
                <button
                  type="submit"
                  className="submit-button-system"
                  disabled={isSubmitting || !answerInput || isError || effectiveInputPaused}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isError && !effectiveInputPaused && !isSubmitting) {
                      handleSubmit(e);
                    }
                  }}
                >
                  제출
                </button>
              </>
            ) : (
              <div className={`answer-input-wrapper ${isError ? 'is-error' : ''}`}>
                <div
                  className={`answer-display ${inputAnimation} ${isError ? 'is-error' : ''} ${showFlash && !isExhausted ? 'input-error-flash' : ''}`}
                >
                  {(isError ? displayValue : answerInput) && (
                    <span className="answer-display-text">
                      {isError ? displayValue : answerInput}
                    </span>
                  )}
                  {!isError && <span className="answer-caret"></span>}
                </div>
              </div>
            )}
          </form>

          {/* 감점 토스트 - 오답 시 -3m 표시 (랜덤 위치) */}
          {showSlideToast && (
            <div
              className={`slide-toast ${isPositiveToast ? 'is-positive' : ''}`}
              style={{ left: damagePosition.left, top: damagePosition.top }}
            >
              <span
                className={`slide-toast-text ${isPositiveToast ? 'is-positive' : ''} ${isExhausted && isPositiveToast ? 'is-exhausted' : ''}`}
              >
                {toastValue}
              </span>
            </div>
          )}
        </div>

        {/* 중단 확인 알림 - fixed 토스트 알림 (퀴즈 카드 가리지 않음) */}
        {showExitConfirm && (
          <div
            className={`exit-confirm-toast ${isFadingOut ? 'fade-out' : ''}`}
            onClick={() => {
              // 토스트 알림 클릭 시 즉시 닫기
              if (exitConfirmTimeoutRef.current) {
                clearTimeout(exitConfirmTimeoutRef.current);
                exitConfirmTimeoutRef.current = null;
              }
              setIsFadingOut(true);
              setTimeout(() => {
                setShowExitConfirm(false);
                setIsFadingOut(false);
              }, 300);
            }}
          >
            <p className="exit-confirm-text">게임을 중단하시겠습니까?</p>
            <p className="exit-confirm-hint">한 번 더 누르면 나갑니다</p>
          </div>
        )}

        {/* 하단 키보드 (카드 아래) - 시스템 키보드 사용 시 숨김 */}
        {!shouldUseSystemKeyboard && (
          <>
            {isJapaneseQuiz ? (
              <QwertyKeypad
                onKeyPress={handleQwertyKeyPress}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                onSubmit={handleSubmit}
                disabled={isSubmitting || isError || effectiveInputPaused}
                mode="text"
              />
            ) : (
              <CustomKeypad
                onNumberClick={handleKeypadNumber}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                onSubmit={handleSubmit}
                disabled={isSubmitting || isError || effectiveInputPaused}
                showNegative={allowNegative}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

// React.memo로 메모이제이션 - props가 변경되지 않으면 리렌더링 방지
export const QuizCard = React.memo(QuizCardComponent, (prevProps, nextProps) => {
  // 커스텀 비교 함수: 중요한 props만 비교
  return (
    prevProps.currentQuestion?.question === nextProps.currentQuestion?.question &&
    prevProps.currentQuestion?.answer === nextProps.currentQuestion?.answer &&
    prevProps.answerInput === nextProps.answerInput &&
    prevProps.displayValue === nextProps.displayValue &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.isError === nextProps.isError &&
    prevProps.showTipModal === nextProps.showTipModal &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.isInputPaused === nextProps.isInputPaused &&
    prevProps.showExitConfirm === nextProps.showExitConfirm &&
    prevProps.isFadingOut === nextProps.isFadingOut &&
    prevProps.cardAnimation === nextProps.cardAnimation &&
    prevProps.inputAnimation === nextProps.inputAnimation &&
    prevProps.questionAnimation === nextProps.questionAnimation &&
    prevProps.showFlash === nextProps.showFlash &&
    prevProps.showSlideToast === nextProps.showSlideToast &&
    prevProps.toastValue === nextProps.toastValue &&
    prevProps.damagePosition.left === nextProps.damagePosition.left &&
    prevProps.damagePosition.top === nextProps.damagePosition.top &&
    prevProps.gameMode === nextProps.gameMode &&
    prevProps.questionKey === nextProps.questionKey &&
    prevProps.lives === nextProps.lives &&
    prevProps.totalQuestions === nextProps.totalQuestions &&
    prevProps.generateNewQuestion === nextProps.generateNewQuestion &&
    prevProps.useSystemKeyboard === nextProps.useSystemKeyboard &&
    prevProps.categoryParam === nextProps.categoryParam
  );
});
