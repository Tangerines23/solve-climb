// src/pages/ResultPage.tsx
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { submitScoreToLeaderboard } from '../utils/tossGameCenter';
import { APP_CONFIG } from '../config/app';
import { SCORE_PER_CORRECT } from '../constants/game';
import {
  validateCategoryParam,
  validateSubTopicParam,
  validateLevelParam,
  validateModeParam,
  validateNumberParam,
  validateFloatParam,
  createSafeStorageKey,
} from '../utils/urlParams';
import { sendDebugLog } from '../utils/debugLogger';
import { useUserStore } from '../stores/useUserStore';
import { supabase } from '../utils/supabaseClient';
import { TierUpgradeModal } from '../components/TierUpgradeModal';
import { BadgeNotification } from '../components/BadgeNotification';
import './ResultPage.css';

// CountUp 애니메이션 훅
function useCountUp(targetValue: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (targetValue === 0) {
      setCount(0);
      return;
    }

    startTimeRef.current = Date.now();
    setCount(0);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current!;
      const progress = Math.min(elapsed / duration, 1);

      // easing 함수 (easeOutCubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(targetValue * eased);

      setCount(currentValue);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(targetValue);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [targetValue, duration]);

  return count;
}

interface WrongAnswer {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
}

export function ResultPage() {
  // Zustand Selector 패턴 적용
  const score = useQuizStore((state) => state.score);
  const clearLevel = useLevelProgressStore((state) => state.clearLevel);
  const updateBestScore = useLevelProgressStore((state) => state.updateBestScore);
  const { fetchUserData } = useUserStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);
  const [previousMasteryScore, setPreviousMasteryScore] = useState<number | null>(null);
  const [currentMasteryScore, setCurrentMasteryScore] = useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = useState<string[]>([]);
  const [_showBadgeNotification, setShowBadgeNotification] = useState(false);

  const { fetchRanking } = useLevelProgressStore();

  // Confetti 색상 팔레트 (CSS 변수에서 읽어옴)
  const confettiColors = useMemo(() => {
    if (typeof window !== 'undefined') {
      const root = getComputedStyle(document.documentElement);
      return [
        root.getPropertyValue('--color-blue-400').trim() || '#00BFA5',
        root.getPropertyValue('--color-confetti-green').trim() || '#10b981',
        root.getPropertyValue('--color-confetti-yellow').trim() || '#f59e0b',
        root.getPropertyValue('--color-red-500').trim() || '#ef4444',
        root.getPropertyValue('--color-confetti-purple').trim() || '#8b5cf6',
      ];
    }
    return ['#00BFA5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  }, []);

  // URL 파라미터 파싱 및 검증
  const categoryParamRaw = searchParams.get('category');
  const subParamRaw = searchParams.get('sub');
  const levelParamRaw = searchParams.get('level');
  const modeParamRaw = searchParams.get('mode');
  const scoreParamRaw = searchParams.get('score');
  const totalParamRaw = searchParams.get('total');
  const wrongQParam = searchParams.get('wrong_q');
  const wrongAParam = searchParams.get('wrong_a');
  const correctAParam = searchParams.get('correct_a');
  const avgTimeParamRaw = searchParams.get('avg_time'); // 서바이벌 모드 평균 풀이 시간
  const isExhaustedParam = searchParams.get('exhausted') === 'true';
  const sessionIdParam = searchParams.get('session_id');
  const userAnswersParam = searchParams.get('user_answers');
  const questionIdsParam = searchParams.get('question_ids');

  // 파라미터 검증
  const categoryParam = validateCategoryParam(categoryParamRaw);
  const currentCategory = categoryParam || 'math';
  const subParam = validateSubTopicParam(categoryParam, subParamRaw);
  const level = validateLevelParam(levelParamRaw, 20);
  const mode = validateModeParam(modeParamRaw);

  // 점수 검증 (0 이상, 최대값 제한)
  const validatedScore = validateNumberParam(scoreParamRaw, 0, 1000000);
  let baseScore = validatedScore !== null ? validatedScore : score;

  // 패널티 적용
  if (isExhaustedParam) {
    baseScore = Math.floor(baseScore * 0.8);
  }
  const finalScore = baseScore;

  // CountUp 애니메이션 적용
  const animatedScore = useCountUp(finalScore, 1500);

  // 총 문제 수 검증
  const validatedTotal = validateNumberParam(totalParamRaw, 0, 10000);
  const total = validatedTotal !== null ? validatedTotal : 0;

  // 맞춘 개수 계산 (점수를 SCORE_PER_CORRECT로 나눔) - 보조 텍스트용
  const correctCount = Math.floor(finalScore / SCORE_PER_CORRECT);

  // 서바이벌 모드: 평균 풀이 시간 (초) 검증
  const validatedAvgTime = validateFloatParam(avgTimeParamRaw, 0, 3600);
  const averageTime = validatedAvgTime;

  // 서브토픽 정보 가져오기
  const subTopicInfo =
    categoryParam && subParam
      ? APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS]?.find(
          (topic) => topic.id === subParam
        )
      : null;

  // 오답 정보 파싱 (서바이벌 모드용)
  const wrongAnswers: WrongAnswer[] = useMemo(() => {
    if (mode !== 'survival' || !wrongQParam || !wrongAParam || !correctAParam) {
      return [];
    }
    try {
      const questions = wrongQParam.split('|');
      const wrongAnswers = wrongAParam.split('|');
      const correctAnswers = correctAParam.split('|');

      return questions.map((q, i) => ({
        question: q,
        wrongAnswer: wrongAnswers[i] || '',
        correctAnswer: correctAnswers[i] || '',
      }));
    } catch (error) {
      console.error('[ResultPage] 오답 데이터 파싱 실패:', error);
      return [];
    }
  }, [mode, wrongQParam, wrongAParam, correctAParam]);

  // 정확도 계산 (맞춘 개수 기준)
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // 레벨 클리어 조건 확인
  // 타임어택: 정확도 50% 이상 또는 1개 이상 맞춤 (finalScore >= 10은 correctCount >= 1과 동일)
  // 서바이벌: 1개 이상 맞춤
  const shouldClearLevel =
    mode === 'time-attack' ? accuracy >= 50 || correctCount >= 1 : correctCount >= 1;

  // 최고 기록 저장 및 레벨 클리어 처리
  useEffect(() => {
    if (!categoryParam || !subParam || !level || !mode) return;

    // localStorage 키 생성: 안전한 키 생성 함수 사용
    const storageKeyMode = mode === 'time-attack' ? 'time_attack' : 'survival';
    const storageKey = createSafeStorageKey(
      'highscore',
      categoryParam,
      subParam,
      level,
      storageKeyMode
    );
    const existingRecord = localStorage.getItem(storageKey);
    const existingScore = existingRecord ? parseInt(existingRecord, 10) : 0;

    // 신기록 확인
    if (finalScore > existingScore) {
      localStorage.setItem(storageKey, finalScore.toString());
      setIsNewRecord(true);
      setShowConfetti(true);
      // confetti 효과는 3초 후 제거
      setTimeout(() => setShowConfetti(false), 3000);
    }

    const syncAndFetchRanking = async () => {
      if (shouldClearLevel && finalScore > 0) {
        await clearLevel(categoryParam, subParam, level, mode, finalScore);
      } else if (finalScore > 0) {
        await updateBestScore(categoryParam, subParam, level, mode, finalScore);
      }

      // 랭킹 정보 가져오기 (데이터 동기화 후)
      if (finalScore > 0) {
        try {
          await fetchRanking(currentCategory, 'weekly', mode);
          const latestRankings =
            useLevelProgressStore.getState().rankings[`${currentCategory}-weekly-${mode}`];
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user && latestRankings) {
            const myRankItem = latestRankings.find((r) => r.user_id === user.id);
            if (myRankItem) {
              setCurrentRank(Number(myRankItem.rank));
            }
          }
        } catch (error) {
          console.error('랭킹 정보를 가져오는데 실패했습니다:', error);
        }
      }
    };

    if (finalScore > 0) {
      syncAndFetchRanking();
    }

    // 리더보드 점수 제출 (레벨 클리어 또는 최고 기록 경신 시)
    if (finalScore > 0 && !scoreSubmitted && shouldClearLevel) {
      // 1. 토스 리더보드 제출
      submitScoreToLeaderboard(finalScore)
        .then(setScoreSubmitted)
        .catch((error) => console.error('점수 제출 실패:', error));

      // 2. Supabase 결과 제출 및 미네랄 획득
      // 새로운 티어 시스템 API 사용 (서버 사이드 채점)
      const submitGameResult = async () => {
        // 현재 사용자 ID 가져오기
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.warn('[ResultPage] 사용자가 로그인하지 않았습니다.');
          return;
        }

        // 현재 마스터리 점수 조회 (티어 업그레이드 확인용)
        const { data: profileBefore } = await supabase
          .from('profiles')
          .select('total_mastery_score')
          .eq('id', user.id)
          .single();

        const previousScore = profileBefore?.total_mastery_score || 0;
        setPreviousMasteryScore(previousScore);

        // RPC는 'timeattack' (하이픈/언더바 없음)을 기대함
        const rpcGameMode = mode === 'time-attack' ? 'timeattack' : 'survival';

        // 사용자 답안과 문제 ID 파싱
        const userAnswersArray = userAnswersParam
          ? userAnswersParam
              .split(',')
              .map((a) => parseInt(a, 10))
              .filter((a) => !isNaN(a))
          : [];
        const questionIdsArray = questionIdsParam
          ? questionIdsParam.split(',').filter((id) => id.length > 0)
          : [];

        // 게임 세션이 있는 경우에만 새로운 API 사용
        if (sessionIdParam && userAnswersArray.length > 0 && questionIdsArray.length > 0) {
          const { data: result, error: resultError } = await supabase.rpc('submit_game_result', {
            p_user_answers: userAnswersArray,
            p_question_ids: questionIdsArray.map((id) => id as any), // UUID 배열
            p_game_mode: rpcGameMode,
            p_items_used: [],
            p_session_id: sessionIdParam as any, // UUID
            p_category: categoryParam || 'math',
            p_subject: subParam || 'add',
            p_level: level || 1,
          });

          if (resultError) {
            console.error('게임 결과 제출 실패:', resultError);
            return;
          }

          fetchUserData();

          // 제출 후 마스터리 점수 다시 조회하여 티어 업그레이드 확인
          const { data: profileAfter } = await supabase
            .from('profiles')
            .select('total_mastery_score')
            .eq('id', user.id)
            .single();

          const newScore = profileAfter?.total_mastery_score || 0;
          setCurrentMasteryScore(newScore);

          // 티어 업그레이드 확인 (점수가 증가했는지 확인)
          if (newScore > previousScore) {
            setShowTierUpgrade(true);
          }

          // 뱃지 획득 확인
          if (result?.awarded_badges && result.awarded_badges.length > 0) {
            setAwardedBadges(result.awarded_badges);
            setShowBadgeNotification(true);
          }
        } else {
          // 게임 세션이 없는 경우 (기존 유저 또는 임시 처리)
          console.warn('[ResultPage] 게임 세션 정보가 없습니다. 점수 제출을 건너뜁니다.');
        }
      };

      submitGameResult();
    }
  }, [
    categoryParam,
    subParam,
    level,
    mode,
    finalScore,
    scoreSubmitted,
    accuracy,
    correctCount,
    clearLevel,
    updateBestScore,
    fetchRanking,
    currentCategory,
    sessionIdParam,
    userAnswersParam,
    questionIdsParam,
    shouldClearLevel,
    fetchUserData,
  ]);

  // 다시 도전하기 - 같은 게임 설정으로 재시작
  const handleRetry = () => {
    // #region agent log
    sendDebugLog('ResultPage.tsx:handleRetry', 'handleRetry called', {
      categoryParam,
      subParam,
      level,
      mode,
      hasMode: !!mode,
    });
    // #endregion

    if (!categoryParam || !subParam || !level || !mode) {
      // #region agent log
      sendDebugLog(
        'ResultPage.tsx:handleRetry:earlyReturn',
        'handleRetry early return - missing params',
        {
          categoryParam,
          subParam,
          level,
          mode,
        }
      );
      // #endregion
      navigate('/');
      return;
    }

    const params = new URLSearchParams();
    params.set('category', categoryParam);
    params.set('sub', subParam);
    params.set('level', level.toString());
    // mode는 'time-attack' 또는 'survival'이지만, URL 파라미터로는 'time_attack' 또는 'survival'을 사용
    const modeParamForUrl = mode === 'time-attack' ? 'time_attack' : mode;
    // #region agent log
    sendDebugLog('ResultPage.tsx:handleRetry:beforeNavigate', 'handleRetry before navigate', {
      mode,
      modeParamForUrl,
      params: params.toString(),
    });
    // #endregion
    params.set('mode', modeParamForUrl);

    navigate(`/quiz?${params.toString()}`);
  };

  // 랭킹 보기
  const handleViewRanking = () => {
    navigate('/ranking');
  };

  // 다른 레벨 선택
  const handleSelectOtherLevel = () => {
    if (categoryParam && subParam) {
      navigate(`/level-select?category=${categoryParam}&sub=${subParam}`);
    } else {
      navigate('/');
    }
  };

  // 닫기 버튼 - 메인 홈으로 이동
  const handleClose = () => {
    navigate('/');
  };

  // 결과 아이콘 및 타이틀
  const isTimeAttack = mode === 'time-attack';
  const isSurvivalMode = mode === 'survival';
  const resultIcon = isTimeAttack ? '⏱️' : '💥';
  const resultTitle = isTimeAttack ? '시간 종료!' : '게임 오버';

  // 통계 리스트 데이터 구성
  const statsList = useMemo(() => {
    const stats: Array<{ label: string; value: string; isHighlight?: boolean }> = [];

    if (isNewRecord) {
      stats.push({
        label: '최고 기록 달성',
        value: 'New! 🏆',
        isHighlight: true,
      });
    }

    if (isTimeAttack && total > 0) {
      stats.push({
        label: '정확도',
        value: `${accuracy}% `,
      });
      stats.push({
        label: '진행',
        value: `${correctCount} / ${total}`,
      });
    }

    if (isSurvivalMode && averageTime !== null) {
      stats.push({
        label: '평균 시간',
        value: `${averageTime.toFixed(2)}초`,
      });
    }

    if (isExhaustedParam) {
      stats.push({
        label: '지침 상태 패널티',
        value: '-20%',
        isHighlight: true,
      });
    }

    if (currentRank) {
      stats.push({
        label: '현재 글로벌 순위',
        value: `${currentRank}위 🏅`,
        isHighlight: true,
      });
    }

    return stats;
  }, [isNewRecord, isTimeAttack, total, accuracy, correctCount, averageTime, currentRank]);

  // 공통 콘텐츠 컴포넌트
  const renderHeaderContent = () => (
    <>
      <div className="result-icon floating">{resultIcon}</div>
      <h1 className="result-title">{resultTitle}</h1>
      {isExhaustedParam && <div className="exhausted-badge">😫 지침 상태 (효율 80%)</div>}
      {level && subTopicInfo && (
        <p className="result-subtitle">
          {APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
            categoryParam}{' '}
          - {subTopicInfo.name} Level {level}
        </p>
      )}
      <div className="score-section">
        <p className="score-value">{animatedScore.toLocaleString()}m</p>
      </div>
    </>
  );

  const renderStatsContent = () => (
    <>
      {statsList.length > 0 && (
        <ul className="stat-list">
          {statsList.map((stat, index) => (
            <li
              key={`${stat.label}-${index}`}
              className={`stat-item ${stat.isHighlight ? 'stat-item-highlight' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </li>
          ))}
        </ul>
      )}
      {isSurvivalMode && wrongAnswers && wrongAnswers.length > 0 && (
        <div className="wrong-answer-card">
          <h3 className="wrong-answer-title">오답 노트</h3>
          <div className="wrong-answer-list">
            {wrongAnswers.map((item, index) => (
              <div key={index} className="wrong-answer-item">
                <div className="wrong-answer-question">{item.question}</div>
                <div className="wrong-answer-row">
                  <span className="wrong-answer-wrong">{item.wrongAnswer}</span>
                  <span className="wrong-answer-correct">{item.correctAnswer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderButtons = () => (
    <>
      <button onClick={handleRetry} className="result-button-primary">
        다시 도전하기
      </button>
      <button onClick={handleViewRanking} className="result-button-secondary">
        랭킹 보기
      </button>
      <button onClick={handleSelectOtherLevel} className="result-button-secondary">
        다른 레벨
      </button>
    </>
  );

  return (
    <div className="page-container result-page">
      {/* Confetti 효과 */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
              }}
            />
          ))}
        </div>
      )}

      {/* 상단 헤더 - 닫기 버튼 */}
      <header className="result-header">
        <button className="result-close-button" onClick={handleClose} aria-label="닫기">
          ✕
        </button>
      </header>

      {/* 결과 카드 (세로모드용) */}
      <div className="result-card">
        <div className="result-header-section">{renderHeaderContent()}</div>
        {renderStatsContent()}
      </div>

      {/* 가로모드용 3단 레이아웃 (하나의 모달) */}
      <div className="result-landscape-layout">
        <div className="result-left-section">
          <div className="result-title-row">
            <div className="result-icon floating">{resultIcon}</div>
            <h1 className="result-title">{resultTitle}</h1>
          </div>
          {level && subTopicInfo && (
            <p className="result-subtitle">
              {APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
                categoryParam}{' '}
              - {subTopicInfo.name} Level {level}
            </p>
          )}
          <div className="score-section">
            <p className="score-value">{animatedScore.toLocaleString()}m</p>
          </div>
        </div>
        <div className="result-divider"></div>
        <div className="result-center-section">{renderStatsContent()}</div>
        <div className="result-divider"></div>
        <div className="result-right-section">{renderButtons()}</div>
      </div>

      {/* 하단 액션 버튼 (세로모드용) */}
      <div className="result-footer-actions">
        <button onClick={handleRetry} className="result-button-primary">
          다시 도전하기
        </button>
        <div className="result-button-group">
          <button onClick={handleViewRanking} className="result-button-secondary">
            랭킹 보기
          </button>
          <button onClick={handleSelectOtherLevel} className="result-button-secondary">
            다른 레벨
          </button>
        </div>
      </div>

      {/* 티어 업그레이드 모달 */}
      {previousMasteryScore !== null && currentMasteryScore !== null && (
        <TierUpgradeModal
          isOpen={showTierUpgrade}
          previousScore={previousMasteryScore}
          currentScore={currentMasteryScore}
          onClose={() => setShowTierUpgrade(false)}
        />
      )}

      {/* 뱃지 획득 알림 */}
      <BadgeNotification
        badgeIds={awardedBadges}
        onClose={() => {
          setShowBadgeNotification(false);
          setAwardedBadges([]);
        }}
      />
    </div>
  );
}
