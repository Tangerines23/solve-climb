// src/pages/ResultPage.tsx
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { submitScoreToLeaderboard } from '../utils/tossGameCenter';
import { SCORE_PER_CORRECT } from '../constants/game';
import {
  validateWorldParam,
  validateCategoryInWorldParam,
  validateLevelParam,
  validateModeParam,
  validateNumberParam,
  validateFloatParam,
  createSafeStorageKey,
} from '../utils/urlParams';
import { useUserStore } from '../stores/useUserStore';
import { supabase } from '../utils/supabaseClient';
import { TierUpgradeModal } from '../components/TierUpgradeModal';
import { BadgeNotification } from '../components/BadgeNotification';
import { urls } from '../utils/navigation';
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

export function ResultPage() {
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
  const [previousMasteryScore] = useState<number | null>(null);
  const [currentMasteryScore] = useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = useState<string[]>([]);
  const [_showBadgeNotification, setShowBadgeNotification] = useState(false);
  const { fetchRanking } = useLevelProgressStore();

  const mountainParam = searchParams.get('mountain');
  const worldParam = validateWorldParam(searchParams.get('world'));
  const categoryParam = validateCategoryInWorldParam(worldParam, searchParams.get('category'));
  const level = validateLevelParam(searchParams.get('level'), 20);
  const mode = validateModeParam(searchParams.get('mode'));
  const finalScore =
    (validateNumberParam(searchParams.get('score'), 0, 1000000) ?? score) *
    (searchParams.get('exhausted') === 'true' ? 0.8 : 1);
  const animatedScore = useCountUp(finalScore, 1500);
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
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    const sync = async () => {
      if (finalScore > 0) {
        if (
          mode === 'time-attack'
            ? Math.round((correctCount / total) * 100) >= 50 || correctCount >= 1
            : correctCount >= 1
        ) {
          await clearLevel(worldParam, categoryParam, level, mode, finalScore);
        } else {
          await updateBestScore(worldParam, categoryParam, level, mode, finalScore);
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
            `${worldParam}-${categoryParam}-weekly-${mode}`
          ];
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && ranks)
          setCurrentRank(Number(ranks.find((r) => r.user_id === user.id)?.rank || null));
      }
    };
    sync();

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
  ]);

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
    if (total > 0) {
      s.push({ label: '정확도', value: `${Math.round((correctCount / total) * 100)}%` });
      s.push({ label: '진행', value: `${correctCount} / ${total}` });
    }
    if (averageTime) s.push({ label: '평균 시간', value: `${averageTime.toFixed(1)}초` });
    if (searchParams.get('exhausted') === 'true')
      s.push({ label: '지침 상태 패널티', value: '-20%', isHighlight: true });
    if (currentRank) s.push({ label: '현재 순위', value: `${currentRank}위`, isHighlight: true });
    return s;
  }, [isNewRecord, total, correctCount, averageTime, searchParams, currentRank]);

  return (
    <div className="page-container result-page">
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#00BFA5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][
                  Math.floor(Math.random() * 5)
                ],
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
      <div className="result-card">
        <div className="result-header-section">
          <div className="result-icon floating">{mode === 'time-attack' ? '⏱️' : '💥'}</div>
          <h1 className="result-title">{mode === 'time-attack' ? '시간 종료!' : '게임 오버'}</h1>
          <p className="result-subtitle">
            {worldParam} - {categoryParam} Level {level}
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
        <ul className="stat-list">
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
      </div>
      <div className="result-footer-actions">
        <button onClick={handleRetry} className="result-button-primary">
          다시 도전하기
        </button>
        <div className="result-button-group">
          <button onClick={() => navigate(urls.ranking())} className="result-button-secondary">
            랭킹 보기
          </button>
          <button onClick={handleLevelSelect} className="result-button-secondary">
            다른 레벨
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
