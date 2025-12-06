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
import { SCORE_PER_CORRECT, CLIMB_PER_CORRECT, SLIDE_PER_WRONG, MAX_POSSIBLE_ANSWER } from '../constants/game';
import { TimerCircle } from '../components/TimerCircle';
import { QwertyKeypad } from '../components/QwertyKeypad';
import { CustomKeypad } from '../components/CustomKeypad';
import { GameTipModal } from '../components/GameTipModal';
import { generateProblem } from '../utils/MathProblemGenerator';
import { generateQuestion } from '../utils/quizGenerator';
import { generateEquation } from '../utils/EquationProblemGenerator';
import { QuizQuestion } from '../types/quiz';
import { APP_CONFIG } from '../config/app';
import { normalizeRomaji } from '../utils/japanese';
import { vibrateMedium, vibrateLong } from '../utils/haptic';
import { useSettingsStore } from '../stores/useSettingsStore';

export function MathQuizPage() {
  const { score, difficulty, increaseScore, decreaseScore, resetQuiz, category, topic, timeLimit, setGameMode, gameMode } = useQuizStore();
  const { hapticEnabled } = useSettingsStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [useSystemKeyboard, setUseSystemKeyboard] = useState(false);
  const [showTipModal, setShowTipModal] = useState(true); // 팁 모달 표시 상태
  const [isError, setIsError] = useState(false); // 오답 상태
  const [displayValue, setDisplayValue] = useState(''); // 입력창에 보여줄 값
  const [showSlideToast, setShowSlideToast] = useState(false); // 감점 토스트 표시 상태
  const [showFlash, setShowFlash] = useState(false); // 플래시 애니메이션 트리거
  const [damagePosition, setDamagePosition] = useState<{ left: string; top: string }>({ left: '50%', top: '50%' }); // 랜덤 위치

  // URL 파라미터에서 레벨 정보 읽기
  const categoryParam = searchParams.get('category');
  const subParam = searchParams.get('sub');
  const levelParam = searchParams.get('level');
  const modeParam = searchParams.get('mode');

  // categoryParam이나 subParam, levelParam이 변경될 때 팁 모달 상태 업데이트
  useEffect(() => {
    if (categoryParam && subParam) {
      const tipKey = levelParam ? `gameTip_${categoryParam}_${subParam}_${levelParam}` : `gameTip_${categoryParam}_${subParam}`;
      const shouldHide = localStorage.getItem(tipKey) === 'true';
      setShowTipModal(!shouldHide);
    }
  }, [categoryParam, subParam, levelParam]);
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
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null); // 현재 문제 시작 시간
  const [solveTimes, setSolveTimes] = useState<number[]>([]); // 서바이벌 모드: 각 문제의 풀이 시간 (초)

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

    console.log('generateNewQuestion params:', { categoryParam, subParam, levelParam });

    if (categoryParam && subParam) {
      const categoryName = APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP];
      if (categoryName) {
        currentCategory = categoryName as any;

        // 레벨에 따라 적절한 topic 매핑 (arithmetic 서브토픽의 경우)
        if (subParam === 'arithmetic' && levelParam) {
          console.log('Entering arithmetic block');
          const level = parseInt(levelParam, 10);
          // 15단계 난이도 시스템 적용 (MathProblemGenerator 사용)
          // 기존 topicMap 로직은 제거하고 바로 generateProblem 호출로 대체
          // 하지만 generateQuestion 함수는 category/topic을 인자로 받으므로
          // 여기서는 새로운 방식과 기존 방식을 분기 처리해야 함

          setQuestionAnimation('fade-out');
          setTimeout(() => {
            try {
              console.log('Calling generateProblem with level:', level);
              // 새로운 MathProblemGenerator 사용
              const problem = generateProblem(level);
              console.log('Generated problem:', problem);
              const newQuestion: QuizQuestion = {
                question: problem.expression,
                answer: problem.answer,
              };
              setCurrentQuestion(newQuestion);
            } catch (e) {
              console.error("Failed to generate problem, falling back to legacy generator", e);
              // 실패 시 기존 로직으로 폴백 (혹은 에러 처리)
              // 기존 로직 유지를 위해 topic 설정
              const topicMap: Record<number, '덧셈' | '뺄셈' | '곱셈' | '나눗셈'> = {
                1: '덧셈', 2: '뺄셈', 3: '덧셈', 4: '뺄셈', 5: '곱셈', 6: '나눗셈',
                7: '덧셈', 8: '곱셈', 9: '나눗셈', 10: '덧셈',
              };
              const fallbackTopic = topicMap[level] || '덧셈';
              // currentCategory가 null일 수 없지만(위에서 체크함), 타입 안전성을 위해 '수학'으로 강제하거나 체크
              const safeCategory = currentCategory || '수학';
              const newQuestion = generateQuestion(safeCategory, fallbackTopic, difficulty);
              setCurrentQuestion(newQuestion);
            }

            setAnswerInput('');
            setDisplayValue('');
            setIsError(false);
            setShowFlash(false);
            setQuestionAnimation('fade-in');

            if (gameMode === 'survival') {
              setQuestionKey((prev) => prev + 1);
              setQuestionStartTime(Date.now());
            }

            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 200);
            }
          }, 150);
          return; // 여기서 함수 종료
        } else if (subParam === 'equations' && levelParam) {
          // 방정식 서브토픽 - EquationProblemGenerator 사용
          const level = parseInt(levelParam, 10);
          
          setQuestionAnimation('fade-out');
          setTimeout(() => {
            try {
              console.log('Calling generateEquation with level:', level);
              // EquationProblemGenerator 사용
              const equation = generateEquation(level);
              console.log('Generated equation:', equation);
              const newQuestion: QuizQuestion = {
                question: equation.question,
                answer: equation.x,
              };
              setCurrentQuestion(newQuestion);
            } catch (e) {
              console.error("Failed to generate equation, falling back to legacy generator", e);
              // 실패 시 기존 로직으로 폴백
              currentTopic = 'equations' as any;
              const safeCategory = currentCategory || '수학';
              const newQuestion = generateQuestion(safeCategory, currentTopic, difficulty);
              setCurrentQuestion(newQuestion);
            }

            setAnswerInput('');
            setDisplayValue('');
            setIsError(false);
            setShowFlash(false);
            setQuestionAnimation('fade-in');

            if (gameMode === 'survival') {
              setQuestionKey((prev) => prev + 1);
              setQuestionStartTime(Date.now());
            }

            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 200);
            }
          }, 150);
          return; // 여기서 함수 종료
        } else if (subParam === 'equations') {
          // 방정식 서브토픽 (레벨 파라미터 없을 때)
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
      setDisplayValue('');
      setIsError(false);
      setQuestionAnimation('fade-in');

      // 서바이벌 모드: 문제가 바뀔 때마다 타이머 리셋 (key 변경으로 TimerCircle 리마운트)
      if (gameMode === 'survival') {
        setQuestionKey((prev) => prev + 1);
        // 서바이벌 모드: 문제 시작 시간 기록
        setQuestionStartTime(Date.now());
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
    setSolveTimes([]); // 풀이 시간 초기화
    setQuestionStartTime(null); // 문제 시작 시간 초기화
    // 팁 모달이 닫힌 후에만 문제 생성
    if (!showTipModal) {
      generateNewQuestion();
    }
  }, [generateNewQuestion, resetQuiz, showTipModal]);

  // 팁 모달이 닫힐 때 첫 문제 생성
  const handleTipClose = () => {
    setShowTipModal(false);
    // 팁 모달이 닫힌 후 문제 생성
    setTimeout(() => {
      generateNewQuestion();
    }, 100);
  };

  const handleGameOver = useCallback(() => {
    // 게임 종료 시 바로 결과 페이지로 이동
    const params = new URLSearchParams();
    if (categoryParam) params.set('category', categoryParam);
    if (subParam) params.set('sub', subParam);
    if (levelParam) params.set('level', levelParam);
    if (modeParam) params.set('mode', modeParam);
    params.set('score', score.toString());
    params.set('total', totalQuestions.toString());

    // 서바이벌 모드: 오답 정보 및 평균 풀이 시간 전달
    if (gameMode === 'survival') {
      console.log('[MathQuizPage] 서바이벌 모드 종료 - 오답 데이터:', {
        wrongAnswersCount: wrongAnswers.length,
        wrongAnswers,
        gameMode,
      });

      if (wrongAnswers.length > 0) {
        const questions = wrongAnswers.map(w => w.question).join('|');
        const wrongAns = wrongAnswers.map(w => w.wrongAnswer).join('|');
        const correctAns = wrongAnswers.map(w => w.correctAnswer).join('|');
        params.set('wrong_q', questions);
        params.set('wrong_a', wrongAns);
        params.set('correct_a', correctAns);
        
        console.log('[MathQuizPage] 오답 데이터 URL 파라미터 설정:', {
          wrong_q: questions,
          wrong_a: wrongAns,
          correct_a: correctAns,
        });
      } else {
        console.log('[MathQuizPage] 오답 데이터 없음 - URL 파라미터 설정 안 함');
      }

      // 평균 풀이 시간 계산 (초 단위, 소수점 2자리)
      if (solveTimes.length > 0) {
        const averageTime = solveTimes.reduce((sum, time) => sum + time, 0) / solveTimes.length;
        params.set('avg_time', averageTime.toFixed(2));
      }
    }

    navigate(`/result?${params.toString()}`);
  }, [categoryParam, subParam, levelParam, modeParam, score, totalQuestions, gameMode, wrongAnswers, solveTimes, navigate]);


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
    if (isSubmitting || isError) return;

    const isEquationQuiz = categoryParam === 'math' && subParam === 'equations';
    const isCalculusQuiz = categoryParam === 'math' && subParam === 'calculus';
    const allowNegative = isEquationQuiz || isCalculusQuiz;

    // 음수 기호 처리
    if (num === '-') {
      if (allowNegative) {
        // 이미 음수면 제거, 아니면 추가
        if (answerInput.startsWith('-')) {
          const newValue = answerInput.substring(1);
          setAnswerInput(newValue);
          setDisplayValue(newValue);
        } else {
          const newValue = '-' + answerInput;
          setAnswerInput(newValue);
          setDisplayValue(newValue);
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
    setAnswerInput((prev) => {
      const newValue = prev + num;
      setDisplayValue(newValue);
      return newValue;
    });
  }, [isSubmitting, categoryParam, subParam, answerInput, isError]);

  // 일본어 퀴즈용 쿼티 키보드 핸들러
  const handleQwertyKeyPress = useCallback((key: string) => {
    if (isSubmitting || isError) return;

    // 일본어 퀴즈: 영문자만 허용
    if (/[a-z]/.test(key)) {
      if (answerInput.length >= 10) return;
      setAnswerInput((prev) => {
        const newValue = prev + key;
        setDisplayValue(newValue);
        return newValue;
      });
    }
  }, [isSubmitting, answerInput, isError]);

  const handleKeypadClear = useCallback(() => {
    if (isSubmitting || isError) return;
    setAnswerInput('');
    setDisplayValue('');
  }, [isSubmitting, isError]);

  const handleKeypadBackspace = useCallback(() => {
    if (isSubmitting || isError) return;
    setAnswerInput((prev) => prev.slice(0, -1));
    setDisplayValue('');
  }, [isSubmitting, isError]);

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
        // 진동 피드백
        if (hapticEnabled) {
          vibrateMedium();
        }
        // 서바이벌 모드: 정답을 맞춘 경우 풀이 시간 기록
        if (gameMode === 'survival' && questionStartTime !== null) {
          const solveTime = (Date.now() - questionStartTime) / 1000; // 초 단위
          setSolveTimes(prev => [...prev, solveTime]);
        }

        setCardAnimation('correct-flash');
        setInputAnimation('correct-flash');
        increaseScore(CLIMB_PER_CORRECT);

        setTimeout(() => {
          setDisplayValue('');
          setIsError(false);
          setShowFlash(false);
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
        // 오답 처리: 정답을 빨간색으로 0.8초간 표시
        const correctAnswerText = String(currentQuestion.answer);
        
        // 1단계: 에러 상태 활성화 및 정답 표시 (동시에 업데이트하여 깜빡임 방지)
        setIsError(true);
        setDisplayValue(correctAnswerText);
        setCardAnimation('wrong-shake');
        
        // 플래시 애니메이션 트리거
        setShowFlash(true);
        setTimeout(() => {
          setShowFlash(false);
        }, 400); // 애니메이션 지속시간과 동일
        
        // 진동 피드백 (토스 표준 API 사용)
        if (hapticEnabled) {
          vibrateLong(); // 긴 진동 사용
        }

        // 서바이벌 모드: 틀리면 게임 종료 (오답 저장)
        if (gameMode === 'survival') {
          // 오답 정보 저장
          const questionText = currentQuestion.question;
          setWrongAnswers(prev => [...prev, {
            question: questionText,
            wrongAnswer: answerInput,
            correctAnswer: correctAnswerText
          }]);

          // 800ms 후 게임 종료
          setTimeout(() => {
            setIsError(false);
            setDisplayValue('');
            setShowFlash(false);
            setInputAnimation('');
            setCardAnimation('');
            handleGameOver();
          }, 800);
        } else {
          // 타임어택 모드: 오답 시 감점 적용
          decreaseScore(SLIDE_PER_WRONG);
          
          // 이전 토스트가 있다면 먼저 제거하고 새로 표시
          setShowSlideToast(false);
          
          // 랜덤 위치 생성 (X: 10-80%, Y: 10-40%)
          const randomLeft = Math.floor(Math.random() * 70) + 10; // 10% ~ 80%
          const randomTop = Math.floor(Math.random() * 30) + 10;  // 10% ~ 40%
          setDamagePosition({ left: `${randomLeft}%`, top: `${randomTop}%` });
          
          // 다음 프레임에 토스트 표시 (React 상태 업데이트 배칭 문제 방지)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setShowSlideToast(true);
              setTimeout(() => {
                setShowSlideToast(false);
              }, 1500);
            });
          });
          
          // 800ms 후 다음 문제로 이동
          setTimeout(() => {
            setIsError(false);
            setDisplayValue('');
            setAnswerInput('');
            setShowFlash(false);
            setShowSlideToast(false); // 명시적으로 초기화
            setInputAnimation('');
            setCardAnimation('');
            generateNewQuestion();
            setIsSubmitting(false);
            // 다음 문제로 넘어갈 때 포커스 유지 (시스템 키보드 사용 시만)
            if (useSystemKeyboard && inputRef.current) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }
          }, 800);
        }
      }
    },
    [answerInput, generateNewQuestion, increaseScore, decreaseScore, isSubmitting, currentQuestion, gameMode, handleGameOver, hapticEnabled, useSystemKeyboard, categoryParam, subParam, questionStartTime, solveTimes]
  );

  const renderQuizCard = () => {
    // 팁 모달이 열려있으면 게임 화면 숨김
    if (showTipModal) {
      return null;
    }

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
                  );
                })()
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
                  disabled={isSubmitting || isError}
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
                disabled={isSubmitting || isError}
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
      {/* 게임 팁 모달 */}
      {categoryParam && subParam && (
        <GameTipModal
          isOpen={showTipModal}
          category={categoryParam}
          subTopic={subParam}
          level={levelParam ? parseInt(levelParam, 10) : null}
          onClose={handleTipClose}
        />
      )}
      {renderQuizCard()}
    </div>
  );
}
