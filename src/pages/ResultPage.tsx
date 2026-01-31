// src/pages/ResultPage.tsx
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizStore } from '@/stores/useQuizStore';
import { useLevelProgressStore } from '@/stores/useLevelProgressStore';
import { submitScoreToLeaderboard } from '@/utils/tossGameCenter';
import { SCORE_PER_CORRECT } from '@/constants/game';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
  validateNumberParam,
  validateFloatParam,
  createSafeStorageKey,
} from '@/utils/urlParams';
import { useUserStore } from '@/stores/useUserStore';
import { useToastStore } from '@/stores/useToastStore';
import { supabase } from '@/utils/supabaseClient';
import { TierUpgradeModal } from '@/components/TierUpgradeModal';
import { BadgeNotification } from '@/components/BadgeNotification';
import { urls } from '@/utils/navigation';
import { Category } from '@/types/quiz';
import { AdService } from '@/utils/adService';
import { analytics } from '@/services/analytics';
import './ResultPage.css';

function useCountUp(targetValue: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (targetValue === 0) {
      setCount(0);
      return;
    }
    startTimeRef.current = Date.now();
    let rid: number;
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current!;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(targetValue * eased));
      if (progress < 1) rid = requestAnimationFrame(animate);
      else setCount(targetValue);
    };
    rid = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rid);
  }, [targetValue, duration]);
  return count;
}

import { useSettingsStore } from '@/stores/useSettingsStore';

export function ResultPage() {
  const score = useQuizStore((state) => state.score);
  const animationEnabled = useSettingsStore((state) => state.animationEnabled);
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
  const [previousMasteryScore] = useState<number | null>(null);
  const [currentMasteryScore] = useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = useState<string[]>([]);
  const [_showBadgeNotification, setShowBadgeNotification] = useState(false);
  const { fetchRanking } = useLevelProgressStore();
  const { rewardMinerals } = useUserStore();
  const { showToast } = useToastStore();

  const mountainParam = searchParams.get('mountain');
  const worldParam = validateWorldParam(searchParams.get('world'));
  const categoryParam = validateCategoryInWorldParam(worldParam, searchParams.get('category'));
  const level = validateLevelParam(searchParams.get('level'), 20);
  const mode = validateModeParam(searchParams.get('mode'));
  const finalScore =
    (validateNumberParam(searchParams.get('score'), 0, 1000000) ?? score) *
    (searchParams.get('exhausted') === 'true' ? 0.8 : 1);
  const animatedScore = useCountUp(finalScore, animationEnabled ? 1500 : 0);
  const total = validateNumberParam(searchParams.get('total'), 0, 10000) ?? 0;
  const correctCount = Math.floor(finalScore / SCORE_PER_CORRECT);
  const averageTime = validateFloatParam(searchParams.get('avg_time'), 0, 3600);

  useEffect(() => {
    if (!worldParam || !categoryParam || !level || !mode) return;
    const key = createSafeStorageKey(
      'highscore',
      worldParam,
      categoryParam,
      level,
      mode === 'time-attack' ? 'time_attack' : 'survival'
    );
    const existing = parseInt(localStorage.getItem(key) || '0', 10);
    if (finalScore > existing) {
      localStorage.setItem(key, finalScore.toString());
      setIsNewRecord(true);
      if (animationEnabled) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
    const sync = async () => {
      const sessionId = searchParams.get('session_id');
      const answersRaw = searchParams.get('user_answers');
      const questionIdsRaw = searchParams.get('question_ids');

      let sessionData = undefined;
      if (sessionId && answersRaw && questionIdsRaw) {
        try {
          sessionData = {
            sessionId,
            answers: JSON.parse(answersRaw),
            questionIds: JSON.parse(questionIdsRaw),
          };
        } catch (e) {
          console.error('[ResultPage] Failed to parse session data:', e);
        }
      }

      if (finalScore > 0) {
        if (
          mode === 'time-attack'
            ? Math.round((correctCount / total) * 100) >= 50 || correctCount >= 1
            : correctCount >= 1
        ) {
          await clearLevel(
            worldParam!,
            categoryParam!,
            level,
            mode === 'time-attack' ? 'time-attack' : 'survival',
            finalScore,
            sessionData
          );
        } else {
          await updateBestScore(
            worldParam!,
            categoryParam!,
            level,
            mode === 'time-attack' ? 'time-attack' : 'survival',
            finalScore,
            sessionData
          );
        }
        // Correct signature: fetchRanking(world, category, period, type, limit?)
        await fetchRanking(
          worldParam!,
          categoryParam!,
          'weekly',
          mode === 'time-attack' ? 'time-attack' : 'survival'
        );
        const ranks =
          useLevelProgressStore.getState().rankings[
            `${worldParam}-${categoryParam}-weekly-${mode === 'time-attack' ? 'time-attack' : 'survival'}`
          ];
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && ranks && Array.isArray(ranks)) {
          const myRanking = ranks.find((r) => r.user_id === user.id);
          if (myRanking) {
            setCurrentRank(Number(myRanking.rank));
          }
        }
      }
    };
    sync();

    // [Added] Quiz End Tracking
    if (worldParam && categoryParam && finalScore >= 0) {
      analytics.trackQuizEnd(
        worldParam,
        categoryParam,
        finalScore,
        correctCount > 0 // 최소 한 문제라도 맞추면 성공으로 간주
      );

      // 추가 상세 메트릭 트래킹
      analytics.trackEvent({
        category: 'quiz',
        action: 'summary',
        data: {
          total_questions: total,
          correct_count: correctCount,
          accuracy: total > 0 ? Math.round((correctCount / total) * 100) : 0,
          avg_time: averageTime,
        },
      });

      // [Anonymous/Local History Saving]
      // 익명 사용자를 위해 로컬 스토리지에 결과 저장
      try {
        const historyKey = 'solve-climb-local-history';
        const rawHistory = localStorage.getItem(historyKey);
        const history = rawHistory ? JSON.parse(rawHistory) : [];

        const newRecord = {
          id: `local-${Date.now()}`,
          world: worldParam,
          category: categoryParam,
          level: level,
          mode: mode,
          score: finalScore,
          correctCount: correctCount,
          total: total,
          date: new Date().toISOString(),
        };

        // 최신순 정렬 및 최대 100개 유지
        const updatedHistory = [newRecord, ...history].slice(0, 100);
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
        console.log('[ResultPage] Saved local history:', newRecord);
      } catch (e) {
        console.warn('[ResultPage] Failed to save local history:', e);
      }
    }

    if (finalScore > 0 && !scoreSubmitted) {
      submitScoreToLeaderboard(finalScore).then(setScoreSubmitted);
    }
  }, [
    worldParam,
    categoryParam,
    level,
    mode,
    finalScore,
    total,
    correctCount,
    scoreSubmitted,
    clearLevel,
    updateBestScore,
    fetchRanking,
    searchParams,
    fetchUserData,
    animationEnabled,
    averageTime,
  ]);

  const [hasDoubled, setHasDoubled] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const baseMinerals = useMemo(() => Math.floor(finalScore / 10), [finalScore]);

  const handleDoubleReward = async () => {
    if (hasDoubled || isAdLoading || baseMinerals <= 0) return;

    setIsAdLoading(true);
    showToast('광고를 불러오는 중... 📺', 'info');

    // 광고 시청 호출
    const adResult = await AdService.showRewardedAd('double_reward');
    if (!adResult.success) {
      showToast(adResult.error || '광고 시청에 실패했습니다.', 'error');
      setIsAdLoading(false);
      return;
    }

    const result = await rewardMinerals(baseMinerals, true);
    if (result.success) {
      showToast(result.message, '💎');
      setHasDoubled(true);
    }
    setIsAdLoading(false);
  };

  // 디버그 로그 추가
  useEffect(() => {
    console.log('[ResultPage] Params:', { worldParam, categoryParam, level, mode, finalScore });
    console.log('[ResultPage] Score submitted:', scoreSubmitted);
  }, [worldParam, categoryParam, level, mode, finalScore, scoreSubmitted]);

  const handleRetry = () => {
    const mountain = mountainParam || 'math';
    if (!worldParam || !categoryParam || !mode || level === null) return;
    navigate(
      urls.quiz({
        mountain,
        world: worldParam,
        category: categoryParam,
        level: level,
        mode: mode === 'time-attack' ? 'time-attack' : 'survival',
      })
    );
  };

  const handleLevelSelect = () => {
    const mountain = mountainParam || 'math';
    const world = worldParam || 'World1';
    const category = categoryParam;

    // category가 유효하지 않으면 category-select로 이동
    if (!category) {
      console.warn('[ResultPage] Invalid category, redirecting to category-select');
      navigate(urls.categorySelect({ mountain: mountain }), { replace: true });
      return;
    }

    navigate(
      urls.levelSelect({
        mountain,
        world,
        category,
      })
    );
  };

  const statsList = useMemo(() => {
    const s = [];
    if (isNewRecord) s.push({ label: '최고 기록 달성', value: 'New! 🏆', isHighlight: true });
    if (mode === 'survival' || mode === 'infinite') {
      s.push({ label: '최고 고도', value: `${correctCount}m`, isHighlight: true });
    }
    if (total > 0 && mode !== 'survival' && mode !== 'infinite') {
      s.push({ label: '정확도', value: `${Math.round((correctCount / total) * 100)}%` });
      s.push({ label: '진행', value: `${correctCount} / ${total}` });
    }
    if (averageTime) s.push({ label: '평균 시간', value: `${averageTime.toFixed(1)}초` });
    if (searchParams.get('exhausted') === 'true')
      s.push({ label: '지침 상태 패널티', value: '-20%', isHighlight: true });
    if (currentRank) s.push({ label: '현재 순위', value: `${currentRank}위`, isHighlight: true });
    return s;
  }, [isNewRecord, total, correctCount, averageTime, searchParams, currentRank, mode]);

  // [Base Camp Result Handling]
  if (mode === 'base-camp-result') {
    const accuracy = searchParams.get('accuracy');
    const recommendation = searchParams.get('recommendation') as Category;

    const courseMap: Record<string, { name: string; icon: string }> = {
      기초: { name: '일반 등반 (General)', icon: '🚶' },
      논리: { name: '탐험 등반 (Exploration)', icon: '🗺️' },
      대수: { name: '급경사 등반 (Steep)', icon: '🧗' },
      심화: { name: '암벽 등반 (Rock Climbing)', icon: '⛰️' },
    };

    const courseEntry = Object.entries(courseMap).find(([k]) => k === recommendation);
    const course = courseEntry ? courseEntry[1] : courseMap['기초'];

    return (
      <div className="page-container result-page base-camp-result">
        <header className="result-header">
          <button className="result-close-button" onClick={() => navigate(urls.home())}>
            ✕
          </button>
        </header>
        <div className="result-card">
          <div className="result-header-section">
            <div className="result-icon floating">🚩</div>
            <h1 className="result-title">진단 완료!</h1>
            <p className="result-subtitle">베이스 캠프에서의 준비가 끝났습니다.</p>

            <div className="diagnostic-summary">
              <div className="diagnostic-stat">
                <span className="stat-label">진단 정확도</span>
                <span className="stat-value">{accuracy}%</span>
              </div>
            </div>

            <div className="recommendation-box">
              <h3>추천 코스</h3>
              <div className="recommendation-card">
                <span className="recommendation-icon">{course.icon}</span>
                <div className="recommendation-info">
                  <span className="course-name">{course.name}</span>
                  <p className="course-desc">당신의 실력에 딱 맞는 난이도입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="result-footer-actions">
          <button
            className="result-button-primary"
            onClick={() =>
              navigate(
                urls.levelSelect({
                  mountain: mountainParam || 'math',
                  world: 'World1',
                  category: recommendation,
                })
              )
            }
          >
            추천 코스로 등반 시작
          </button>
          <button
            className="result-button-secondary"
            onClick={() => (window.location.href = `/world/${worldParam}`)}
            style={{ marginTop: 'var(--spacing-sm)' }}
          >
            월드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // [Smart Retry Result Page]
  if (mode === 'smart-retry') {
    // For now, reuse the normal result UI but maybe with a special title
  }

  return (
    <div className={`page-container result-page ${mode}`}>
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: [
                  'var(--color-teal-500)',
                  'var(--color-green-500)',
                  'var(--color-yellow-500)',
                  'var(--color-red-500)',
                  'var(--color-purple-500)',
                ][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}
      <header className="result-header">
        <button className="result-close-button" onClick={() => navigate(urls.home())}>
          ✕
        </button>
      </header>
      {/* 세로모드 레이아웃 */}
      <div className="result-card">
        <div className="result-header-section">
          <div className="result-icon floating">{mode === 'time-attack' ? '⏱️' : '🔥'}</div>
          <h1 className="result-title">{mode === 'time-attack' ? '시간 종료!' : '도전 종료'}</h1>
          <p className="result-subtitle">
            {worldParam} - {categoryParam}{' '}
            {mode === 'survival' || mode === 'infinite' ? '서바이벌 챌린지' : `Level ${level}`}
          </p>
          <div className="score-section">
            <p className="score-value">{animatedScore.toLocaleString()}m</p>
          </div>

          {/* v2.2 데스노트 (Death Note) - 생존 모드 전용 */}
          {mode === 'survival' && searchParams.get('last_q') && (
            <div className="death-note-container">
              <h3 className="death-note-title">마지막 고비 💀</h3>
              <div className="death-note-card">
                <div className="death-note-question">{searchParams.get('last_q')}</div>
                <div className="death-note-answer-row">
                  <span className="death-note-wrong">내 오답: {searchParams.get('wrong_a')}</span>
                  <span className="death-note-correct">정답: {searchParams.get('correct_a')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <ul className="stat-list" data-vg-ignore="true">
          {statsList.map((s, i) => (
            <li
              key={i}
              className={`stat-item ${s.isHighlight ? 'stat-item-highlight' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </li>
          ))}
        </ul>

        {finalScore > 0 && !hasDoubled && (
          <div className="double-reward-section">
            <button
              className="double-reward-btn"
              onClick={handleDoubleReward}
              disabled={isAdLoading}
            >
              <span>{isAdLoading ? '⌛' : '📺'}</span>{' '}
              {isAdLoading ? '보상 지급 중...' : `결과 보상 2배로 받기 (+${baseMinerals}💎)`}
            </button>
          </div>
        )}
      </div>

      <div className="result-footer-actions">
        <button className="result-button-primary" onClick={handleRetry}>
          다시 도전하기
        </button>
        <button
          className="result-button-secondary"
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('mode', 'smart-retry');
            window.location.href = `/quiz?${params.toString()}`;
          }}
          style={{ marginTop: 'var(--spacing-sm)' }}
        >
          데스노트 복수하기 (맞춤 재시도)
        </button>
        <div className="result-button-group">
          <button
            onClick={() =>
              navigate(
                urls.ranking({
                  world: worldParam || undefined,
                  category: categoryParam || undefined,
                  mode: mode || undefined,
                })
              )
            }
            className="result-button-secondary"
          >
            랭킹 보기
          </button>
          <button onClick={handleLevelSelect} className="result-button-secondary">
            다른 레벨
          </button>
        </div>
      </div>

      {/* 가로모드 레이아웃 (Landscape) */}
      <div className="result-landscape-layout">
        <div className="result-left-section">
          <div className="result-title-row">
            <div className="result-icon floating">{mode === 'time-attack' ? '⏱️' : '💥'}</div>
            <h1 className="result-title">{mode === 'time-attack' ? '시간 종료!' : '게임 오버'}</h1>
          </div>
          <p className="result-subtitle">
            {worldParam} - {categoryParam} Level {level}
          </p>
          <div className="score-section">
            <p className="score-value">{animatedScore.toLocaleString()}m</p>
          </div>
        </div>

        <div className="result-divider"></div>

        <div className="result-center-section">
          <ul className="stat-list" data-vg-ignore="true">
            {statsList.map((s, i) => (
              <li
                key={i}
                className={`stat-item ${s.isHighlight ? 'stat-item-highlight' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </li>
            ))}
          </ul>

          {/* 가로모드 데스노트 */}
          {mode === 'survival' && searchParams.get('last_q') && (
            <div className="wrong-answer-card">
              <h3 className="wrong-answer-title">마지막 고비 💀</h3>
              <div className="wrong-answer-item">
                <div className="wrong-answer-question">{searchParams.get('last_q')}</div>
                <div className="wrong-answer-row">
                  <span className="wrong-answer-wrong">오답: {searchParams.get('wrong_a')}</span>
                  <span className="wrong-answer-correct">
                    정답: {searchParams.get('correct_a')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="result-divider"></div>

        <div className="result-right-section">
          <button onClick={handleRetry} className="result-button-primary">
            다시 도전하기
          </button>
          <button
            onClick={() =>
              navigate(
                urls.ranking({
                  world: worldParam || undefined,
                  category: categoryParam || undefined,
                  mode: mode || undefined,
                })
              )
            }
            className="result-button-secondary"
          >
            랭킹 보기
          </button>
          <button onClick={handleLevelSelect} className="result-button-secondary">
            다른 레벨
          </button>
          <button onClick={() => navigate(urls.home())} className="result-button-secondary">
            홈으로 이동
          </button>
        </div>
      </div>
      {previousMasteryScore !== null && currentMasteryScore !== null && (
        <TierUpgradeModal
          isOpen={showTierUpgrade}
          previousScore={previousMasteryScore}
          currentScore={currentMasteryScore}
          onClose={() => setShowTierUpgrade(false)}
        />
      )}
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
