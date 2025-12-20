// 퀴즈 카드 컴포넌트
import React, { FormEvent, useMemo } from 'react';
import { QuizQuestion } from '../types/quiz';
import { GameMode } from '../types/quiz';
import { TimerCircle } from './TimerCircle';
import { QwertyKeypad } from './QwertyKeypad';
import { CustomKeypad } from './CustomKeypad';
import { APP_CONFIG } from '../config/app';
import { SLIDE_PER_WRONG } from '../constants/game';
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
  SURVIVAL_QUESTION_TIME: number;

  // 상태
  isSubmitting: boolean;
  isError: boolean;
  useSystemKeyboard: boolean;
  showTipModal: boolean;
  showExitConfirm: boolean;
  isFadingOut: boolean;

  // 애니메이션
  cardAnimation: string;
  inputAnimation: string;
  questionAnimation: string;
  showFlash: boolean;
  showSlideToast: boolean;
  damagePosition: { left: string; top: string };

  // 핸들러
  handleSubmit: (e: FormEvent) => void;
  handleBack: () => void;
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
  setIsError: (value: boolean) => void;
  setShowFlash: (value: boolean) => void;
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
  SURVIVAL_QUESTION_TIME,
  isSubmitting,
  isError,
  useSystemKeyboard,
  showTipModal,
  showExitConfirm,
  isFadingOut,
  cardAnimation,
  inputAnimation,
  questionAnimation,
  showFlash,
  showSlideToast,
  damagePosition,
  handleSubmit,
  handleBack,
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
}: QuizCardProps) {
  // #region agent log
  const renderId = Math.random().toString(36).substring(7);
  sendDebugLog('QuizCard.tsx:108', 'QuizCard component entry', {
    renderId,
    showTipModal,
    hasCurrentQuestion: !!currentQuestion,
  });
  // #endregion

  // 팁 모달이 열려있으면 게임 화면 숨김
  if (showTipModal) {
    // #region agent log
    sendDebugLog('QuizCard.tsx:earlyReturn1', 'Early return: showTipModal=true', { renderId });
    // #endregion
    return null;
  }

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
      const subTopicInfo = subTopics?.find(t => t.id === subParam);
      return subTopicInfo?.name || subParam;
    }
  }, [categoryParam, subParam, levelParam, topic]);

  // 모든 hooks를 조건부 반환 이전에 호출해야 함 (React Hooks 규칙)
  const isJapaneseQuiz = useMemo(() => {
    // #region agent log
    sendDebugLog('QuizCard.tsx:isJapaneseQuiz', 'isJapaneseQuiz useMemo executing', {
      renderId,
      categoryParam,
      subParam,
    });
    // #endregion
    return categoryParam === 'language' && subParam === 'japanese';
  }, [categoryParam, subParam, renderId]);

  const isEquationQuiz = useMemo(() => {
    return categoryParam === 'math' && subParam === 'equations';
  }, [categoryParam, subParam]);

  const isCalculusQuiz = useMemo(() => {
    return categoryParam === 'math' && subParam === 'calculus';
  }, [categoryParam, subParam]);

  const allowNegative = useMemo(() => {
    // #region agent log
    sendDebugLog('QuizCard.tsx:allowNegative', 'allowNegative useMemo executing', {
      renderId,
      isEquationQuiz,
      isCalculusQuiz,
    });
    // #endregion
    return isEquationQuiz || isCalculusQuiz;
  }, [isEquationQuiz, isCalculusQuiz, renderId]);

  // 조건부 반환은 모든 hooks 호출 이후에 수행
  if (!currentQuestion || (!displayCategory && !categoryParam) || (!displayTopic && !subParam)) {
    // #region agent log
    sendDebugLog('QuizCard.tsx:earlyReturn2', 'Early return: missing data', {
      renderId,
      hasCurrentQuestion: !!currentQuestion,
      displayCategory,
      displayTopic,
      categoryParam,
      subParam,
    });
    // #endregion
    // 로딩 중이거나 데이터가 없으면 로딩 표시
    if (categoryParam && subParam) {
      return (
        <div className="math-quiz-page">
          <div className="quiz-loading">문제를 생성하는 중...</div>
        </div>
      );
    }
    return null;
  }

  const { activeItems, consumeActiveItem } = useGameStore();

  const handleTimeUp = () => {
    const hasFlare = activeItems.includes('flare');
    if (hasFlare) {
      consumeActiveItem('flare');
      console.log('[Game] Flare used! Revived from time up.');
    } else {
      handleGameOver();
    }
  };

  return (
    <>
      {/* 상단 네비게이션 (뒤로가기 + 타이머) */}
      <header className="math-quiz-header">
        <button className="math-quiz-back-button" onClick={handleBack} aria-label="뒤로 가기">
          ←
        </button>
        <div className="math-quiz-timer-container">
          {gameMode === 'survival' ? (
            <TimerCircle duration={SURVIVAL_QUESTION_TIME} onComplete={handleTimeUp} isPaused={isSubmitting} key={questionKey} />
          ) : (
            <TimerCircle duration={timeLimit} onComplete={handleTimeUp} isPaused={false} enableFastForward={true} />
          )}
        </div>
        <div className="math-quiz-header-spacer"></div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="math-quiz-content">
        {/* 퀴즈 카드 */}
        <div className={`quiz-card ${cardAnimation}`}>
          <div className="category-label">{displayCategory} - {displayTopic}</div>
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className={questionAnimation}>
              <h2 className="problem-text">
                {currentQuestion.question}
              </h2>
            </div>
            {/* 답안 표시 영역 - 시스템 키보드 사용 시 input, 아니면 display */}
            {useSystemKeyboard ? (
              <>
                <div className={`answer-input-wrapper ${isError ? 'is-error' : ''}`}>
                  <input
                    ref={inputRef}
                    type={isJapaneseQuiz ? 'text' : 'number'}
                    inputMode={isJapaneseQuiz ? 'text' : 'numeric'}
                    value={isError ? displayValue : answerInput}
                    onChange={(e) => {
                      if (isError || isSubmitting) return;
                      if (isJapaneseQuiz) {
                        // 일본어: 영문자만 허용 (로마지)
                        const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                        if (value.length <= 10) {
                          setAnswerInput(value);
                          setDisplayValue(value);
                        }
                      } else {
                        // 수학: 숫자 및 음수 처리
                        let value = e.target.value;
                        if (allowNegative) {
                          // 음수 기호와 숫자만 허용
                          value = value.replace(/[^0-9-]/g, '');
                          // 음수 기호는 맨 앞에만 허용
                          if (value.includes('-') && value.indexOf('-') !== 0) {
                            value = value.replace(/-/g, '');
                            value = '-' + value;
                          }
                          // 음수 기호가 여러 개면 하나만 유지
                          const minusCount = (value.match(/-/g) || []).length;
                          if (minusCount > 1) {
                            value = '-' + value.replace(/-/g, '');
                          }
                          if (value.length <= 6) {
                            setAnswerInput(value);
                            setDisplayValue(value);
                          }
                        } else {
                          // 일반 수학 문제: 숫자만 허용
                          value = value.replace(/[^0-9]/g, '');
                          if (value.length <= 5) {
                            setAnswerInput(value);
                            setDisplayValue(value);
                          }
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isError) {
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
                    placeholder={isJapaneseQuiz ? "로마지 입력 (예: a, ki)" : "정답 입력"}
                    className={`answer-input-system ${inputAnimation} ${isError ? 'error-state is-error' : ''} ${showFlash ? 'input-error-flash' : ''}`}
                    disabled={isSubmitting && !isError}
                    readOnly={isError}
                    autoFocus={false}
                  />
                </div>
                <button
                  type="submit"
                  className="submit-button-system"
                  disabled={isSubmitting || !answerInput || isError}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isError) {
                      handleSubmit(e);
                    }
                  }}
                >
                  제출
                </button>
              </>
            ) : (
              <div className={`answer-input-wrapper ${isError ? 'is-error' : ''}`}>
                <div className={`answer-display ${inputAnimation} ${isError ? 'is-error' : ''} ${showFlash ? 'input-error-flash' : ''}`}>
                  {(isError ? displayValue : answerInput) && (
                    <span className="answer-display-text">{isError ? displayValue : answerInput}</span>
                  )}
                  {!isError && <span className="answer-caret"></span>}
                </div>
              </div>
            )}
          </form>

          {/* 감점 토스트 - 오답 시 -3m 표시 (랜덤 위치) */}
          {showSlideToast && (
            <div
              className="slide-toast"
              style={{ left: damagePosition.left, top: damagePosition.top }}
            >
              <span className="slide-toast-text">-{SLIDE_PER_WRONG}m</span>
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
        {!useSystemKeyboard && (
          <>
            {isJapaneseQuiz ? (
              <QwertyKeypad
                onKeyPress={handleQwertyKeyPress}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                onSubmit={handleSubmit}
                disabled={isSubmitting || isError}
                mode="text"
              />
            ) : (
              <CustomKeypad
                onNumberClick={handleKeypadNumber}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                onSubmit={handleSubmit}
                disabled={isSubmitting || isError}
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
    prevProps.showExitConfirm === nextProps.showExitConfirm &&
    prevProps.isFadingOut === nextProps.isFadingOut &&
    prevProps.cardAnimation === nextProps.cardAnimation &&
    prevProps.inputAnimation === nextProps.inputAnimation &&
    prevProps.questionAnimation === nextProps.questionAnimation &&
    prevProps.showFlash === nextProps.showFlash &&
    prevProps.showSlideToast === nextProps.showSlideToast &&
    prevProps.damagePosition.left === nextProps.damagePosition.left &&
    prevProps.damagePosition.top === nextProps.damagePosition.top &&
    prevProps.gameMode === nextProps.gameMode &&
    prevProps.questionKey === nextProps.questionKey &&
    prevProps.useSystemKeyboard === nextProps.useSystemKeyboard
  );
});

