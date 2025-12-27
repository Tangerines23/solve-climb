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
  timerResetKey?: number;
  SURVIVAL_QUESTION_TIME: number;
  onSafetyRopeUsed?: () => void;

  // 상태
  isSubmitting: boolean;
  isError: boolean;
  useSystemKeyboard: boolean;
  showTipModal: boolean;
  isPaused: boolean; // New prop for global pause (modal, countdown)
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
  timerResetKey,
  SURVIVAL_QUESTION_TIME,
  isSubmitting,
  isError,
  useSystemKeyboard,
  showTipModal,
  isPaused,
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
  onSafetyRopeUsed,
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
        1: '덧셈', 2: '뺄셈', 3: '덧셈', 4: '뺄셈', 5: '곱셈',
        6: '나눗셈', 7: '혼합 연산', 8: '곱셈', 9: '나눗셈', 10: '종합 연산',
      };
      return topicMap[level] || '덧셈';
    } else if (subParam === 'calculus' && levelParam !== null) {
      const level = levelParam;
      const topicMap: Record<number, string> = {
        1: '기초 미분', 2: '상수배 미분', 3: '합과 차의 미분', 4: '곱의 미분', 5: '몫의 미분',
        6: '합성함수 미분', 7: '삼각함수 미분', 8: '지수·로그 미분', 9: '고급 미분', 10: '미분 종합',
      };
      return topicMap[level] || '미적분';
    } else {
      const subTopics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
      const subTopicInfo = subTopics?.find(t => t.id === subParam);
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

  const { activeItems, consumeActiveItem } = useGameStore();

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
    const hasFlare = gameMode === 'survival' && activeItems.includes('flare');

    if (hasSafetyRope) {
      consumeActiveItem('safety_rope');
      console.log('[Game] Safety Rope used! Saved from time up.');
      if (onSafetyRopeUsed) onSafetyRopeUsed();
      // 타임어택의 경우 시간이 다 되면? -> 안전 로프는 "1회 방어" 이므로 시간을 조금 더 주거나(리셋) 
      // 아니면 그냥 게임오버만 막고 시간은 0초? 0초면 바로 또 죽음.
      // 따라서 "시간 리셋"이 필요함. 혹은 문제 스킵?
      // 사용자 요청: "오답 처리를 무효화하고 해당 문제 화면에 머무르게" -> Time Up도 비슷하게 처리.
      // Time Up 상황에서 머무르려면 시간을 채워줘야 함.
      // 라스트 스페어처럼 15초? 아니면 원래 제한시간? 일단 서바이벌은 5초, 타임어택은 timeLimit.
      // QuizCard는 Timer를 리셋할 권한이 없음 (props로 받음). 
      // 하지만 TimerCircle은 key가 바뀌지 않으면 내부 state만 가짐. 
      // QuizCard에서 TimerCircle을 강제 리셋하려면 key를 바꿔야 함.
      // -> onSafetyRopeUsed에서 key 업데이트를 요청해야 함? 
      // -> QuizPage에서 handleSafetyRopeUsed 호출 시 QuestionKey를 업데이트하지 않으면 Timer는 0에서 멈춤.
      // -> SafetyRopeOverlay가 1.5초 동안 뜨고, 그 뒤에 재개?
      // -> QuizPage의 handleSafetyRopeUsed에서 추가 처리 필요.
    } else if (hasLastSpurt) {
      // 타임어택 전용: 라스트 스퍼트는 LastChanceModal에서 처리
      // 여기서는 게임 오버로 처리하여 모달이 뜨도록 함
      handleGameOver();
    } else if (hasFlare) {
      // 서바이벌 전용: 구조 신호탄 사용
      consumeActiveItem('flare');
      console.log('[Game] Flare used! Revived from time up.');
      // 서바이벌에서는 새 문제로 넘어감
    } else {
      handleGameOver();
    }
  };

  return (
    <>
      {/* 상단 네비게이션 (뒤로가기 + 타이머) */}
      <header className="quiz-header">
        <button className="quiz-back-button" onClick={handleBack} aria-label="뒤로 가기">
          ←
        </button>
        <div className="quiz-timer-container">
          {gameMode === 'survival' ? (
            <TimerCircle duration={SURVIVAL_QUESTION_TIME} onComplete={handleTimeUp} isPaused={isSubmitting || isPaused} key={questionKey} />
          ) : (
            <TimerCircle duration={timeLimit} onComplete={handleTimeUp} isPaused={isPaused} enableFastForward={true} key={`${timeLimit}-${timerResetKey || 0}`} />
          )}
        </div>
        <div className="quiz-header-spacer"></div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <div className="quiz-content">
        {/* 퀴즈 카드 */}
        <div className={`quiz-card ${cardAnimation}`}>
          <div className="category-label">{displayCategory} - {displayTopic}</div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (isPaused || isSubmitting || isError) return;
            handleSubmit(e);
          }} style={{ display: 'contents' }}>
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
                      if (isError || isSubmitting || isPaused) return; // Disable input on pause
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
                      if (e.key === 'Enter' && !isError && !isPaused && !isSubmitting) {
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
                    disabled={(isSubmitting && !isError) || isPaused}
                    readOnly={isError}
                    autoFocus={false}
                  />
                </div>
                <button
                  type="submit"
                  className="submit-button-system"
                  disabled={isSubmitting || !answerInput || isError || isPaused}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isError && !isPaused && !isSubmitting) {
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
                disabled={isSubmitting || isError || isPaused}
                mode="text"
              />
            ) : (
              <CustomKeypad
                onNumberClick={handleKeypadNumber}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                onSubmit={handleSubmit}
                disabled={isSubmitting || isError || isPaused}
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

