// src/pages/ResultPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { GameMode } from '../types/quiz';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Confetti 색상 팔레트 (CSS 변수에서 읽어옴)
  const confettiColors = React.useMemo(() => {
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

  // 파라미터 검증
  const categoryParam = validateCategoryParam(categoryParamRaw);
  const subParam = validateSubTopicParam(categoryParam, subParamRaw);
  const level = validateLevelParam(levelParamRaw, 20);
  const mode = validateModeParam(modeParamRaw);
  
  // 점수 검증 (0 이상, 최대값 제한)
  const validatedScore = validateNumberParam(scoreParamRaw, 0, 1000000);
  const finalScore = validatedScore !== null ? validatedScore : score;

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
  const subTopicInfo = categoryParam && subParam
    ? APP_CONFIG.SUB_TOPICS[categoryParam as keyof typeof APP_CONFIG.SUB_TOPICS]?.find(
        (topic) => topic.id === subParam
      )
    : null;

  // 오답 정보 파싱 (서바이벌 모드용)
  const wrongAnswers: WrongAnswer[] = React.useMemo(() => {
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

  // 최고 기록 저장 및 레벨 클리어 처리
  useEffect(() => {
    if (!categoryParam || !subParam || !level || !mode) return;

    // localStorage 키 생성: 안전한 키 생성 함수 사용
    const storageKeyMode = mode === 'time-attack' ? 'time_attack' : 'survival';
    const storageKey = createSafeStorageKey('highscore', categoryParam, subParam, level, storageKeyMode);
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

    // 레벨 클리어 조건 확인
    // 타임어택: 정확도 50% 이상 또는 1개 이상 맞춤 (finalScore >= 10은 correctCount >= 1과 동일)
    // 서바이벌: 1개 이상 맞춤
    const shouldClearLevel = mode === 'time-attack' 
      ? (accuracy >= 50 || correctCount >= 1)
      : (correctCount >= 1);

    if (shouldClearLevel && finalScore > 0) {
      // 레벨 클리어 처리 (자동으로 최고 기록도 업데이트됨)
      clearLevel(categoryParam, subParam, level, mode, finalScore);
    } else if (finalScore > 0) {
      // 클리어는 아니지만 최고 기록만 업데이트
      updateBestScore(categoryParam, subParam, level, mode, finalScore);
    }

    // 리더보드 점수 제출 (레벨 클리어 또는 최고 기록 경신 시)
    if (finalScore > 0 && !scoreSubmitted && shouldClearLevel) {
      submitScoreToLeaderboard(finalScore)
        .then(setScoreSubmitted)
        .catch((error) => {
          // 에러가 발생해도 게임 진행에 방해되지 않도록 조용히 처리
          console.error('점수 제출 실패:', error);
        });
    }
  }, [categoryParam, subParam, level, mode, finalScore, scoreSubmitted, accuracy, correctCount, clearLevel, updateBestScore]);

  // 다시 도전하기 - 같은 게임 설정으로 재시작
  const handleRetry = () => {
    if (!categoryParam || !subParam || !level || !modeParam) {
      navigate('/');
      return;
    }
    
    const params = new URLSearchParams();
    params.set('category', categoryParam);
    params.set('sub', subParam);
    params.set('level', level.toString());
    params.set('mode', modeParam);
    
    navigate(`/math-quiz?${params.toString()}`);
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
  const resultTitle = isTimeAttack ? "시간 종료!" : "게임 오버";

  // 통계 리스트 데이터 구성
  const statsList = React.useMemo(() => {
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
        value: `${accuracy}%`,
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

    return stats;
  }, [isNewRecord, isTimeAttack, total, accuracy, correctCount, averageTime]);

  // 공통 콘텐츠 컴포넌트
  const renderHeaderContent = () => (
    <>
      <div className="result-icon floating">{resultIcon}</div>
      <h1 className="result-title">{resultTitle}</h1>
      {level && subTopicInfo && (
        <p className="result-subtitle">
          {APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] || categoryParam} - {subTopicInfo.name} Level {level}
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
            <div key={i} className="confetti" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            }} />
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
        <div className="result-header-section">
          {renderHeaderContent()}
        </div>
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
              {APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] || categoryParam} - {subTopicInfo.name} Level {level}
            </p>
          )}
          <div className="score-section">
            <p className="score-value">{animatedScore.toLocaleString()}m</p>
          </div>
        </div>
        <div className="result-divider"></div>
        <div className="result-center-section">
          {renderStatsContent()}
        </div>
        <div className="result-divider"></div>
        <div className="result-right-section">
          {renderButtons()}
        </div>
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
    </div>
  );
}
