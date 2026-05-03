// src/pages/ResultPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResultPageBridge } from '@/hooks/useResultPageBridge';
import { SCORE_PER_CORRECT } from '@/constants/game';

import { TierUpgradeModal } from '@/components/TierUpgradeModal';
import { BadgeNotification } from '@/components/BadgeNotification';
import { Category } from '@/types/quiz';

import { analytics } from '@/services/analytics';
import { UI_MESSAGES } from '@/constants/ui';
import { ANIMATION_CONFIG } from '@/constants/game';
import './ResultPage.css';

import { useCountUp } from '@/hooks/useCountUp';

import { historyService } from '@/services/historyService';

import { storageService, STORAGE_KEYS } from '@/services';

export function ResultPage() {
  const {
    storeCategory,
    storeWorld,
    storeLevel,
    storeMode,
    storeScore,
    animationEnabled,
    rankings,
    clearLevel,
    updateBestScore,
    fetchRanking,
    rewardMinerals,
    showToast,
    submitScoreToLeaderboard,
    urls,
    AdService,
    supabase,
    urlParams,
  } = useResultPageBridge();

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
  const [, setShowBadgeNotification] = useState(false);

  const mountainParam = searchParams.get('mountain');
  const worldParam = urlParams.validateWorldParam(searchParams.get('world'));
  const categoryParam = urlParams.validateCategoryInWorldParam(
    worldParam,
    searchParams.get('category')
  );
  const level = urlParams.validateLevelParam(searchParams.get('level'), 20);
  const mode = urlParams.validateModeParam(searchParams.get('mode'));
  const finalScore =
    (urlParams.validateNumberParam(searchParams.get('score'), 0, 1000000) ?? storeScore) *
    (searchParams.get('exhausted') === 'true' ? 0.8 : 1);
  const animatedScore = useCountUp(finalScore, animationEnabled ? 1500 : 0);
  const total = urlParams.validateNumberParam(searchParams.get('total'), 0, 10000) ?? 0;
  const correctCount = Math.floor(finalScore / SCORE_PER_CORRECT);
  const averageTime = urlParams.validateFloatParam(searchParams.get('avg_time'), 0, 3600);

  useEffect(() => {
    if (!worldParam || !categoryParam || !level || !mode) return;
    const key = urlParams.createSafeStorageKey(
      STORAGE_KEYS.HIGH_SCORE_PREFIX,
      worldParam,
      categoryParam,
      level,
      mode === 'time-attack' ? 'time_attack' : 'survival'
    );

    const existing = parseInt(storageService.get<string>(key) || '0', 10);
    if (finalScore > existing) {
      storageService.set(key, finalScore.toString());
      setIsNewRecord(true);
      if (animationEnabled) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), ANIMATION_CONFIG.CONFETTI_DURATION);
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
            averageTime ?? undefined,
            sessionData
          );
        } else {
          await updateBestScore(
            worldParam!,
            categoryParam!,
            level,
            mode === 'time-attack' ? 'time-attack' : 'survival',
            finalScore,
            averageTime ?? undefined,
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
          rankings[
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
      // 익명 사용자를 위해 historyService를 통해 결과 저장
      historyService.saveRecord({
        world: worldParam,
        category: categoryParam as Category,
        level: level,
        mode: mode as string,
        score: finalScore,
        correctCount: correctCount,
        total: total,
      });
      console.log('[ResultPage] Saved local history via historyService');
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
    searchParams,
    animationEnabled,
    averageTime,
    clearLevel,
    updateBestScore,
    fetchRanking,
    rankings,
    submitScoreToLeaderboard,
    supabase,
    urlParams,
  ]);

  const [hasDoubled, setHasDoubled] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const baseMinerals = useMemo(() => Math.floor(finalScore / 10), [finalScore]);

  const handleDoubleReward = async () => {
    if (hasDoubled || isAdLoading || baseMinerals <= 0) return;

    setIsAdLoading(true);
    showToast(UI_MESSAGES.AD_LOADING, 'info');

    // 광고 시청 호출
    const adResult = await AdService.showRewardedAd('double_reward');
    if (!adResult.success) {
      showToast(adResult.error || UI_MESSAGES.AD_LOAD_FAILED, 'error');
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
    // URL 파라미터가 없으면 Store에서 가져옴 (보충 로직)
    const finalWorld = worldParam || storeWorld;
    const finalCategory = categoryParam || storeCategory;
    const finalLevel = level !== null ? level : storeLevel;
    const finalMode = mode || storeMode;

    console.log('[ResultPage] handleRetry attempting with:', {
      mountain,
      finalWorld,
      finalCategory,
      finalMode,
      finalLevel,
    });

    if (!finalWorld || !finalCategory || !finalMode || finalLevel === null) {
      console.error('[ResultPage] handleRetry failed: Still missing critical params', {
        worldParam,
        storeWorld,
        categoryParam,
        storeCategory,
        level,
        storeLevel,
        mode,
        storeMode,
      });
      showToast('상태 정보를 불러올 수 없어 재시도에 실패했습니다.', 'error');
      return;
    }

    const targetUrl = urls.quiz({
      mountain,
      world: finalWorld,
      category: finalCategory,
      level: finalLevel,
      mode: finalMode === 'time-attack' ? 'time-attack' : 'survival',
    });

    console.log('[ResultPage] Navigating to:', targetUrl);
    navigate(targetUrl);
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
    if (isNewRecord)
      s.push({ label: UI_MESSAGES.NEW_RECORD_LABEL, value: 'New! 🏆', isHighlight: true });
    if (mode === 'survival' || mode === 'infinite') {
      s.push({ label: UI_MESSAGES.CURRENT_ALTITUDE, value: `${correctCount}m`, isHighlight: true });
    }
    if (total > 0 && mode !== 'survival' && mode !== 'infinite') {
      s.push({
        label: UI_MESSAGES.ACCURACY,
        value: `${Math.round((correctCount / total) * 100)}%`,
      });
      s.push({ label: UI_MESSAGES.PROGRESS, value: `${correctCount} / ${total}` });
    }
    if (averageTime)
      s.push({ label: UI_MESSAGES.AVERAGE_TIME, value: `${averageTime.toFixed(1)}초` });
    if (searchParams.get('exhausted') === 'true')
      s.push({ label: UI_MESSAGES.EXHAUSTED_PENALTY, value: '-20%', isHighlight: true });
    if (currentRank)
      s.push({ label: UI_MESSAGES.CURRENT_RANK, value: `${currentRank}위`, isHighlight: true });
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
            <h1 className="result-title">{UI_MESSAGES.DIAGNOSIS_COMPLETE}</h1>
            <p className="result-subtitle">{UI_MESSAGES.BASE_CAMP_PREP_DONE}</p>

            <div className="diagnostic-summary">
              <div className="diagnostic-stat">
                <span className="stat-label">진단 {UI_MESSAGES.ACCURACY}</span>
                <span className="stat-value">{accuracy}%</span>
              </div>
            </div>

            <div className="recommendation-box">
              <h3>{UI_MESSAGES.RECOMMENDED_COURSE}</h3>
              <div className="recommendation-card">
                <span className="recommendation-icon">{course.icon}</span>
                <div className="recommendation-info">
                  <span className="course-name">{course.name}</span>
                  <p className="course-desc">{UI_MESSAGES.COURSE_MATCH_DESC}</p>
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
            {UI_MESSAGES.START_RECOMMENDED_COURSE}
          </button>
          <button
            className="result-button-secondary mt-sm"
            onClick={() => (window.location.href = `/world/${worldParam}`)}
          >
            {UI_MESSAGES.RETURN_TO_WORLD}
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
              style={
                {
                  '--left': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 0.5}s`,
                  '--color': [
                    'var(--color-teal-500)',
                    'var(--color-green-500)',
                    'var(--color-yellow-500)',
                    'var(--color-red-500)',
                    'var(--color-purple-500)',
                  ][Math.floor(Math.random() * 5)],
                } as React.CSSProperties
              }
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
          <h1 className="result-title">
            {mode === 'time-attack' ? UI_MESSAGES.TIME_UP : UI_MESSAGES.CHALLENGE_END}
          </h1>
          <p className="result-subtitle">
            {worldParam} - {categoryParam}{' '}
            {mode === 'survival' || mode === 'infinite'
              ? UI_MESSAGES.SURVIVAL_CHALLENGE
              : `${UI_MESSAGES.LEVEL_LABEL} ${level}`}
          </p>
          <div className="score-section" data-vg-ignore="true">
            <p className="score-value">{animatedScore.toLocaleString()}m</p>
          </div>

          {/* v2.2 데스노트 (Death Note) - 생존 모드 전용 */}
          {mode === 'survival' && searchParams.get('last_q') && (
            <div className="death-note-container">
              <h3 className="death-note-title">{UI_MESSAGES.LAST_HURDLE}</h3>
              <div className="death-note-card">
                <div className="death-note-question">{searchParams.get('last_q')}</div>
                <div className="death-note-answer-row">
                  <span className="death-note-wrong">
                    {UI_MESSAGES.MY_WRONG_ANSWER}: {searchParams.get('wrong_a')}
                  </span>
                  <span className="death-note-correct">
                    {UI_MESSAGES.CORRECT_ANSWER}: {searchParams.get('correct_a')}
                  </span>
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
              style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
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
              {isAdLoading
                ? UI_MESSAGES.REWARD_GIVING
                : `${UI_MESSAGES.DOUBLE_REWARD} (+${baseMinerals}💎)`}
            </button>
          </div>
        )}
      </div>

      <div className="result-footer-actions">
        <button className="result-button-primary" onClick={handleRetry}>
          {UI_MESSAGES.RESULT_RETRY}
        </button>
        <button
          className="result-button-secondary mt-sm"
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('mode', 'smart-retry');
            window.location.href = `/quiz?${params.toString()}`;
          }}
        >
          {UI_MESSAGES.REVENGE_DEATHNOTE}
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
            {UI_MESSAGES.RANKING_VIEW}
          </button>
          <button onClick={handleLevelSelect} className="result-button-secondary">
            {UI_MESSAGES.OTHER_LEVELS}
          </button>
        </div>
      </div>

      {/* 가로모드 레이아웃 (Landscape) */}
      <div className="result-landscape-layout">
        <div className="result-left-section">
          <div className="result-title-row">
            <div className="result-icon floating">{mode === 'time-attack' ? '⏱️' : '💥'}</div>
            <h1 className="result-title">
              {mode === 'time-attack' ? UI_MESSAGES.TIME_UP : UI_MESSAGES.GAME_OVER}
            </h1>
          </div>
          <p className="result-subtitle">
            {worldParam} - {categoryParam} {UI_MESSAGES.LEVEL_LABEL} {level}
          </p>
          <div className="score-section" data-vg-ignore="true">
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
                style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
              >
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </li>
            ))}
          </ul>

          {/* 가로모드 데스노트 */}
          {mode === 'survival' && searchParams.get('last_q') && (
            <div className="wrong-answer-card">
              <h3 className="wrong-answer-title">{UI_MESSAGES.LAST_HURDLE}</h3>
              <div className="wrong-answer-item">
                <div className="wrong-answer-question">{searchParams.get('last_q')}</div>
                <div className="wrong-answer-row">
                  <span className="wrong-answer-wrong">
                    {UI_MESSAGES.MY_WRONG_ANSWER}: {searchParams.get('wrong_a')}
                  </span>
                  <span className="wrong-answer-correct">
                    {UI_MESSAGES.CORRECT_ANSWER}: {searchParams.get('correct_a')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="result-divider"></div>

        <div className="result-right-section">
          <button onClick={handleRetry} className="result-button-primary">
            {UI_MESSAGES.RESULT_RETRY}
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
            {UI_MESSAGES.RANKING_VIEW}
          </button>
          <button onClick={handleLevelSelect} className="result-button-secondary">
            {UI_MESSAGES.OTHER_LEVELS}
          </button>
          <button onClick={() => navigate(urls.home())} className="result-button-secondary">
            {UI_MESSAGES.GO_HOME}
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
