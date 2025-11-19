// src/pages/MathQuizPage.tsx
import {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  useRef,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './MathQuizPage.css';
import { useQuizStore } from '../stores/useQuizStore';
import { SCORE_PER_CORRECT, MAX_POSSIBLE_ANSWER } from '../constants/game';
import { TimerCircle } from '../components/TimerCircle';
import { QwertyKeypad } from '../components/QwertyKeypad';
import { CustomKeypad } from '../components/CustomKeypad';
import { generateQuestion } from '../utils/quizGenerator';
import { QuizQuestion } from '../types/quiz';
import { APP_CONFIG } from '../config/app';
import { normalizeRomaji } from '../utils/japanese';

export function MathQuizPage() {
  const { score, difficulty, increaseScore, resetQuiz, category, topic, timeLimit, setGameMode, gameMode } = useQuizStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [useSystemKeyboard, setUseSystemKeyboard] = useState(false);
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animation states
  const [cardAnimation, setCardAnimation] = useState('');
  const [inputAnimation, setInputAnimation] = useState('');
  const [questionAnimation, setQuestionAnimation] = useState('fade-in');

  // 서바이벌 모드: 문제당 타이머 (5초)
  const SURVIVAL_QUESTION_TIME = 5;
  const [questionKey, setQuestionKey] = useState(0); // 문제가 바뀔 때마다 증가하여 타이머 리셋

  // 게임 통계 추적
  const [totalQuestions, setTotalQuestions] = useState(0); // 총 문제 수
  const [wrongAnswers, setWrongAnswers] = useState<Array<{ question: string; wrongAnswer: string; correctAnswer: string }>>([]); // 서바이벌 모드 오답

  // URL 파라미터에서 레벨 정보 읽기
  const categoryParam = searchParams.get('category');
  const subParam = searchParams.get('sub');
  const levelParam = searchParams.get('level');
  const modeParam = searchParams.get('mode');

  // 게임 모드 설정
  useEffect(() => {
    if (modeParam) {
      const mode = modeParam === 'time_attack' ? 'time-attack' : modeParam === 'survival' ? 'survival' : 'time-attack';
      setGameMode(mode);
    }
  }, [modeParam, setGameMode]);

  // URL 파라미터에서 category와 topic 설정
  const { setCategoryTopic } = useQuizStore();
  useEffect(() => {
    if (categoryParam && subParam) {
      const categoryName = APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
      if (categoryName) {
        // subParam을 topic으로 사용 (예: 'japanese', 'arithmetic')
        setCategoryTopic(categoryName as any, subParam as any);
      }
    }
  }, [categoryParam, subParam, setCategoryTopic]);

  // 카테고리나 분야가 선택되지 않았으면 홈으로 리다이렉트
  useEffect(() => {
    if (!category || !topic) {
      // URL 파라미터가 있으면 잠시 대기 (위의 useEffect가 실행되도록)
      if (!categoryParam || !subParam) {
        navigate('/');
      }
    }
  }, [category, topic, navigate, categoryParam, subParam]);

  const generateNewQuestion = useCallback(() => {
    // URL 파라미터가 있으면 직접 사용, 없으면 store에서 가져오기
    let currentCategory = category;
    let currentTopic = topic;
    
    if (categoryParam && subParam) {
      const categoryName = APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
      if (categoryName) {
        currentCategory = categoryName as any;
        
        // 레벨에 따라 적절한 topic 매핑 (arithmetic 서브토픽의 경우)
        if (subParam === 'arithmetic' && levelParam) {
          const level = parseInt(levelParam, 10);
          // 레벨 1: 덧셈, 레벨 2: 뺄셈, 레벨 3: 덧셈, 레벨 4: 뺄셈, 레벨 5: 곱셈, 레벨 6: 나눗셈...
          const topicMap: Record<number, '덧셈' | '뺄셈' | '곱셈' | '나눗셈'> = {
            1: '덧셈',
            2: '뺄셈',
            3: '덧셈',
            4: '뺄셈',
            5: '곱셈',
            6: '나눗셈',
            7: '덧셈', // 혼합 연산은 덧셈으로 시작
            8: '곱셈',
            9: '나눗셈',
            10: '덧셈', // 종합 연산은 덧셈으로 시작
          };
          currentTopic = topicMap[level] || '덧셈';
        } else if (subParam === 'equations') {
          // 방정식 서브토픽
          currentTopic = 'equations' as any;
        } else if (subParam === 'calculus') {
          // 미적분 서브토픽
          currentTopic = 'calculus' as any;
        } else {
          // 다른 서브토픽은 subParam을 그대로 사용
          currentTopic = subParam as any;
        }
      }
    }
    
    if (!currentCategory || !currentTopic) return;
    
    setQuestionAnimation('fade-out');
    setTimeout(() => {
      const newQuestion = generateQuestion(currentCategory, currentTopic, difficulty);
      setCurrentQuestion(newQuestion);
      setAnswerInput('');
      setQuestionAnimation('fade-in');
      
      // 서바이벌 모드: 문제가 바뀔 때마다 타이머 리셋 (key 변경으로 TimerCircle 리마운트)
      if (gameMode === 'survival') {
        setQuestionKey((prev) => prev + 1);
      }

      // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
      if (useSystemKeyboard && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);
      }
    }, 150);
  }, [category, topic, difficulty, gameMode, categoryParam, subParam, levelParam, useSystemKeyboard]);

  useEffect(() => {
    resetQuiz(); // Reset score when component mounts
    setTotalQuestions(0); // 문제 수 초기화
    setWrongAnswers([]); // 오답 초기화
    generateNewQuestion();
  }, [generateNewQuestion, resetQuiz]);

  const handleGameOver = useCallback(() => {
    // 게임 종료 시 바로 결과 페이지로 이동
    const params = new URLSearchParams();
    if (categoryParam) params.set('category', categoryParam);
    if (subParam) params.set('sub', subParam);
    if (levelParam) params.set('level', levelParam);
    if (modeParam) params.set('mode', modeParam);
    params.set('score', score.toString());
    params.set('total', totalQuestions.toString());
    
    // 서바이벌 모드: 오답 정보 전달
    if (gameMode === 'survival' && wrongAnswers.length > 0) {
      const questions = wrongAnswers.map(w => w.question).join('|');
      const wrongAns = wrongAnswers.map(w => w.wrongAnswer).join('|');
      const correctAns = wrongAnswers.map(w => w.correctAnswer).join('|');
      params.set('wrong_q', questions);
      params.set('wrong_a', wrongAns);
      params.set('correct_a', correctAns);
    }
    
    navigate(`/result?${params.toString()}`);
  }, [categoryParam, subParam, levelParam, modeParam, score, totalQuestions, gameMode, wrongAnswers, navigate]);


  // 뒤로 가기 핸들러 (더블클릭 기믹)
  const handleBack = () => {
    if (showExitConfirm) {
      // 두 번째 클릭: 바로 뒤로가기 실행
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
        exitConfirmTimeoutRef.current = null;
      }
      setIsFadingOut(false);
      setShowExitConfirm(false);
      if (categoryParam && subParam) {
        navigate(`/level-select?category=${categoryParam}&sub=${subParam}`);
      } else {
        navigate('/');
      }
    } else {
      // 첫 번째 클릭: 알림 표시
      setIsFadingOut(false);
      setShowExitConfirm(true);
      // 3초 후 자동으로 알림 숨김 (페이드 아웃)
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
      }
      exitConfirmTimeoutRef.current = setTimeout(() => {
        // 페이드 아웃 애니메이션 시작
        setIsFadingOut(true);
        setTimeout(() => {
          setShowExitConfirm(false);
          setIsFadingOut(false);
          exitConfirmTimeoutRef.current = null;
        }, 300); // 페이드 아웃 애니메이션 시간
      }, 3000);
    }
  };

  // 화면 높이 감지 및 키보드 모드 전환
  useEffect(() => {
    const checkViewportHeight = () => {
      // 실제 뷰포트 높이 확인 (모바일 주소창 제외)
      const height = window.innerHeight;
      const width = window.innerWidth;
      const aspectRatio = height / width;
      
      // 높이가 600px 이하이거나, 가로가 세로보다 긴 경우(가로 모드) 시스템 키보드 사용
      // 또는 화면 비율이 너무 낮은 경우
      const shouldUseSystemKeyboard = height < 600 || aspectRatio < 0.7;
      setUseSystemKeyboard(shouldUseSystemKeyboard);
    };

    // 초기 체크
    checkViewportHeight();
    
    // 리사이즈 이벤트 (디바운싱)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkViewportHeight, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkViewportHeight, 200);
    });

    // Visual Viewport API 사용 (모바일 키보드 감지)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkViewportHeight);
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkViewportHeight);
      }
    };
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (exitConfirmTimeoutRef.current) {
        clearTimeout(exitConfirmTimeoutRef.current);
        exitConfirmTimeoutRef.current = null;
      }
    };
  }, []);

  // 수학 퀴즈용 키패드 핸들러 (3x3 그리드)
  const handleKeypadNumber = useCallback((num: string) => {
    if (isSubmitting) return;
    
    const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
    const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
    const allowNegative = isEquationQuiz || isCalculusQuiz;
    
    // 음수 기호 처리
    if (num === '-') {
      if (allowNegative) {
        // 이미 음수면 제거, 아니면 추가
        if (answerInput.startsWith('-')) {
          setAnswerInput(answerInput.substring(1));
        } else {
          setAnswerInput('-' + answerInput);
        }
        if (navigator.vibrate) navigator.vibrate(15);
      }
      return;
    }
    
    // 최대 자리수 제한 (방정식/미적분은 음수 기호 포함 6자리, 일반은 5자리)
    const maxLength = allowNegative ? 6 : 5;
    if (answerInput.length >= maxLength) return;
    
    // 음수 기호가 있으면 숫자만 추가
    if (answerInput.startsWith('-')) {
      if (answerInput.length >= maxLength) return;
    }
    
    // 진동 피드백
    if (navigator.vibrate) navigator.vibrate(15);
    setAnswerInput((prev) => prev + num);
  }, [isSubmitting, categoryParam, subParam, answerInput]);

  // 일본어 퀴즈용 쿼티 키보드 핸들러
  const handleQwertyKeyPress = useCallback((key: string) => {
    if (isSubmitting) return;
    
    // 일본어 퀴즈: 영문자만 허용
    if (/[a-z]/.test(key)) {
      if (answerInput.length >= 10) return;
      setAnswerInput((prev) => prev + key);
    }
  }, [isSubmitting, answerInput]);

  const handleKeypadClear = useCallback(() => {
    if (isSubmitting) return;
    setAnswerInput('');
  }, [isSubmitting]);

  const handleKeypadBackspace = useCallback(() => {
    if (isSubmitting) return;
    setAnswerInput((prev) => prev.slice(0, -1));
  }, [isSubmitting]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isSubmitting || !currentQuestion) return;
      
      // 값이 비어있으면 무시
      if (!answerInput || answerInput.trim() === '') return;

      setIsSubmitting(true);
      
      // 일본어 퀴즈인지 확인 (category가 '언어'이고 subParam이 'japanese'인 경우)
      const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
      // 방정식/미적분 문제인지 확인 (음수 답도 허용)
      const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
      const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
      const allowNegative = isEquationQuiz || isCalculusQuiz;
      
      let isCorrect = false;
      
      if (isJapaneseQuiz) {
        // 일본어 퀴즈: 문자열 답안 비교 (대소문자, 공백 무시)
        const normalizedInput = normalizeRomaji(answerInput);
        const normalizedAnswer = normalizeRomaji(String(currentQuestion.answer));
        isCorrect = normalizedInput === normalizedAnswer;
      } else {
        // 수학 문제: 숫자 답안 비교
        const answer = parseInt(answerInput, 10);
        // 방정식/미적분 문제는 음수도 허용, 일반 수학 문제는 0 이상만 허용
        const minValue = allowNegative ? -999 : 0;
        if (isNaN(answer) || answer < minValue || answer > MAX_POSSIBLE_ANSWER) {
          setCardAnimation('wrong-shake');
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => setCardAnimation(''), 150);
          setIsSubmitting(false);
          return;
        }
        isCorrect = typeof currentQuestion.answer === 'number' 
          ? currentQuestion.answer === answer
          : false;
      }

      // 문제 수 증가
      setTotalQuestions(prev => prev + 1);

      if (isCorrect) {
        setCardAnimation('correct-flash');
        setInputAnimation('correct-flash');
        increaseScore(SCORE_PER_CORRECT);
        
        setTimeout(() => {
          generateNewQuestion();
          setInputAnimation('');
          setCardAnimation('');
          setIsSubmitting(false);
          // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
          if (useSystemKeyboard && inputRef.current) {
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }
        }, 300);
      } else {
        setCardAnimation('wrong-shake');
        if (navigator.vibrate) navigator.vibrate(200);
        
        // 서바이벌 모드: 틀리면 게임 종료 (오답 저장)
        if (gameMode === 'survival') {
          // 오답 정보 저장
          const questionText = currentQuestion.question;
          const correctAnswerText = String(currentQuestion.answer);
          setWrongAnswers(prev => [...prev, {
            question: questionText,
            wrongAnswer: answerInput,
            correctAnswer: correctAnswerText
          }]);
          
          setTimeout(() => {
            handleGameOver();
          }, 300);
        } else {
          setTimeout(() => {
            generateNewQuestion();
            setCardAnimation('');
            setIsSubmitting(false);
            // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }
          }, 300);
        }
      }
    },
    [answerInput, generateNewQuestion, increaseScore, isSubmitting, currentQuestion, gameMode, handleGameOver]
  );

  const renderQuizCard = () => {
    // URL 파라미터가 있으면 그것을 우선 사용, 없으면 store에서 가져오기
    const displayCategory = categoryParam 
      ? APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] || category
      : category;
    
    let displayTopic: string | null = topic;
    if (categoryParam && subParam) {
      if (subParam === 'arithmetic' && levelParam) {
        const level = parseInt(levelParam, 10);
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
        displayTopic = topicMap[level] || '덧셈';
      } else if (subParam === 'calculus' && levelParam) {
        const level = parseInt(levelParam, 10);
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
        displayTopic = topicMap[level] || '미적분';
      } else {
        const subTopics = APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS];
        const subTopicInfo = subTopics?.find(t => t.id === subParam);
        displayTopic = subTopicInfo?.name || subParam;
      }
    }
    
    if (!currentQuestion || (!displayCategory && !categoryParam) || (!displayTopic && !subParam)) {
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

    return (
      <>
        {/* 상단 네비게이션 (뒤로가기 + 타이머) */}
        <header className="math-quiz-header">
          <button className="math-quiz-back-button" onClick={handleBack} aria-label="뒤로 가기">
            ←
          </button>
          <div className="math-quiz-timer-container">
            {gameMode === 'survival' ? (
              <TimerCircle duration={SURVIVAL_QUESTION_TIME} onComplete={handleGameOver} isPaused={isSubmitting} key={questionKey} />
            ) : (
              <TimerCircle duration={timeLimit} onComplete={handleGameOver} isPaused={false} enableFastForward={true} />
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
                (() => {
                  const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
                  const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
                  const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
                  const allowNegative = isEquationQuiz || isCalculusQuiz;
                  
                  return (
                    <>
                      <input
                        ref={inputRef}
                        type={isJapaneseQuiz ? 'text' : 'number'}
                        inputMode={isJapaneseQuiz ? 'text' : 'numeric'}
                        value={answerInput}
                        onChange={(e) => {
                          if (isJapaneseQuiz) {
                            // 일본어: 영문자만 허용 (로마지)
                            const value = e.target.value.replace(/[^a-zA-Z]/g, '');
                            if (value.length <= 10) {
                              setAnswerInput(value);
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
                              }
                            } else {
                              // 일반 수학 문제: 숫자만 허용
                              value = value.replace(/[^0-9]/g, '');
                              if (value.length <= 5) {
                                setAnswerInput(value);
                              }
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                        onClick={() => {
                          // 클릭 시 키보드 포커스
                          if (inputRef.current && !isSubmitting) {
                            inputRef.current.focus();
                          }
                        }}
                        placeholder={isJapaneseQuiz ? "로마지 입력 (예: a, ki)" : "정답 입력"}
                        className={`answer-input-system ${inputAnimation}`}
                        disabled={isSubmitting}
                        autoFocus={false}
                      />
                      <button
                        type="submit"
                        className="submit-button-system"
                        disabled={isSubmitting || !answerInput}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubmit(e);
                        }}
                      >
                        제출
                      </button>
                    </>
                  );
                })()
              ) : (
                <div className={`answer-display ${inputAnimation}`}>
                  {answerInput && <span className="answer-display-text">{answerInput}</span>}
                  <span className="answer-caret"></span>
                </div>
              )}
            </form>
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
          {!useSystemKeyboard && (() => {
            const isJapaneseQuiz = categoryParam === 'language' && subParam === 'japanese';
            const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
            const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
            const allowNegative = isEquationQuiz || isCalculusQuiz;
            
            // 일본어 퀴즈: 쿼티 키보드 사용
            if (isJapaneseQuiz) {
              return (
                <QwertyKeypad
                  onKeyPress={handleQwertyKeyPress}
                  onClear={handleKeypadClear}
                  onBackspace={handleKeypadBackspace}
                  onSubmit={handleSubmit}
                  disabled={isSubmitting}
                  mode="text"
                />
              );
            }
            
            // 수학 퀴즈: 3x3 숫자 키패드 사용
            return (
              <CustomKeypad
                onNumberClick={handleKeypadNumber}
                onClear={handleKeypadClear}
                onBackspace={handleKeypadBackspace}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
                showNegative={allowNegative}
              />
            );
          })()}
        </div>
      </>
    );
  };

  // 화면 어디든 클릭하면 토스트 닫기
  useEffect(() => {
    if (!showExitConfirm) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 토스트 자체를 클릭한 경우는 제외 (토스트 내부 클릭은 무시)
      if (!target.closest('.exit-confirm-toast')) {
        if (exitConfirmTimeoutRef.current) {
          clearTimeout(exitConfirmTimeoutRef.current);
          exitConfirmTimeoutRef.current = null;
        }
        setIsFadingOut(true);
        setTimeout(() => {
          setShowExitConfirm(false);
          setIsFadingOut(false);
        }, 300);
      }
    };

    // 짧은 딜레이 후 이벤트 리스너 추가 (토스트가 나타난 직후 클릭 방지)
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExitConfirm]);

  return (
    <div className="math-quiz-page">
      {renderQuizCard()}
    </div>
  );
}
