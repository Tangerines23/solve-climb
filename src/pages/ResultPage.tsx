// src/pages/ResultPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizStore } from '../stores/useQuizStore';
import { GameMode, useLevelProgressStore } from '../stores/useLevelProgressStore';
import { submitScore } from '../utils/gameCenter';
import { APP_CONFIG } from '../config/app';
import { SCORE_PER_CORRECT } from '../constants/game';
import './ResultPage.css';

interface WrongAnswer {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
}

export function ResultPage() {
  const { score } = useQuizStore();
  const { clearLevel, updateBestScore } = useLevelProgressStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // URL 파라미터 파싱
  const categoryParam = searchParams.get('category');
  const subParam = searchParams.get('sub');
  const levelParam = searchParams.get('level');
  const modeParam = searchParams.get('mode');
  const scoreParam = searchParams.get('score');
  const totalParam = searchParams.get('total');
  const wrongQParam = searchParams.get('wrong_q');
  const wrongAParam = searchParams.get('wrong_a');
  const correctAParam = searchParams.get('correct_a');
  const avgTimeParam = searchParams.get('avg_time'); // 서바이벌 모드 평균 풀이 시간

  // 점수는 URL 파라미터 우선, 없으면 store에서 가져오기
  const finalScore = scoreParam ? parseInt(scoreParam, 10) : score;
  const total = totalParam ? parseInt(totalParam, 10) : 0;
  
  // 맞춘 개수 계산 (점수를 SCORE_PER_CORRECT로 나눔)
  const correctCount = Math.floor(finalScore / SCORE_PER_CORRECT);
  
  // 서바이벌 모드: 평균 풀이 시간 (초)
  const averageTime = avgTimeParam ? parseFloat(avgTimeParam) : null;

  // 레벨 정보 가져오기
  const level = levelParam ? parseInt(levelParam, 10) : null;
  const mode: GameMode | null = modeParam === 'time_attack' ? 'time-attack' : modeParam === 'survival' ? 'survival' : null;

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
    } catch {
      return [];
    }
  }, [mode, wrongQParam, wrongAParam, correctAParam]);

  // 정확도 계산 (맞춘 개수 기준)
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // 최고 기록 저장 및 레벨 클리어 처리
  useEffect(() => {
    if (!categoryParam || !subParam || !level || !mode) return;

    // localStorage 키 생성: highscore_{category}_{sub}_{level}_{mode}
    const storageKey = `highscore_${categoryParam}_${subParam}_${level}_${modeParam}`;
    const existingRecord = localStorage.getItem(storageKey);
    const existingScore = existingRecord ? parseInt(existingRecord, 10) : 0;

    // 신기록 확인
    if (finalScore > existingScore) {
      localStorage.setItem(storageKey, finalScore.toString());
      setIsNewRecord(true);
    }

    // 레벨 클리어 조건 확인
    // 타임어택: 정확도 50% 이상 또는 점수 10점 이상
    // 서바이벌: 1개 이상 맞춤
    const shouldClearLevel = mode === 'time-attack' 
      ? (accuracy >= 50 || finalScore >= 10)
      : (correctCount >= 1);

    if (shouldClearLevel && finalScore > 0) {
      // 레벨 클리어 처리 (자동으로 최고 기록도 업데이트됨)
      clearLevel(categoryParam, subParam, level, mode, finalScore);
    } else if (finalScore > 0) {
      // 클리어는 아니지만 최고 기록만 업데이트
      updateBestScore(categoryParam, subParam, level, mode, finalScore);
    }

    // 리더보드 점수 제출
    if (finalScore > 0 && !scoreSubmitted) {
      submitScore(finalScore).then(setScoreSubmitted);
    }
  }, [categoryParam, subParam, level, mode, modeParam, finalScore, scoreSubmitted, accuracy, correctCount, clearLevel, updateBestScore]);

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
  const resultIcon = mode === 'time-attack' ? '⏱️' : '💥';
  const resultTitle = mode === 'time-attack' ? "시간 종료!" : "게임 오버";

  return (
    <div className="page-container result-page">
      {/* 상단 헤더 - 닫기 버튼 */}
      <header className="result-header">
        <button className="result-close-button" onClick={handleClose} aria-label="닫기">
          ✕
        </button>
      </header>

      {/* 결과 카드 */}
      <div className="result-card">
        {/* 결과 아이콘 */}
        <div className="result-icon">{resultIcon}</div>

        {/* 결과 타이틀 */}
        <h1 className="result-title">{resultTitle}</h1>

        {/* 레벨 정보 */}
        {level && subTopicInfo && (
          <div className="result-level-info">
            <p className="result-level-text">
              {APP_CONFIG.CATEGORY_MAP[categoryParam as keyof typeof APP_CONFIG.CATEGORY_MAP] || categoryParam} - {subTopicInfo.name} Level {level}
            </p>
          </div>
        )}

        {/* 최종 점수 (맞춘 개수) */}
        <div className="score-section">
          <p className="score-value">{correctCount.toLocaleString()} 개</p>
        </div>

        {/* 통계 섹션 (타임어택/서바이벌 공통) */}
        <div className="game-stats">
          {/* 타임 어택 모드: 정확도 */}
          {mode === 'time-attack' && total > 0 && (
            <div className="stat-badge">
              정확도 {accuracy}%
            </div>
          )}
          
          {/* 서바이벌 모드: 평균 풀이 시간 */}
          {mode === 'survival' && averageTime !== null && (
            <div className="stat-badge">
              평균 풀이 시간: {averageTime.toFixed(2)}초
            </div>
          )}
          
          {/* 총 시도 횟수 (타임어택 모드) */}
          {mode === 'time-attack' && total > 0 && (
            <div className="stat-attempts">
              {correctCount} / {total}
            </div>
          )}
        </div>

        {/* 신기록 배지 */}
        {isNewRecord && (
          <div className="new-record-badge">
            🎉 최고 기록 달성!
          </div>
        )}

        {/* 오답 노트 (서바이벌 전용) */}
        {mode === 'survival' && wrongAnswers.length > 0 && (
          <div className="wrong-answers-section">
            <h3 className="wrong-answers-title">오답 노트</h3>
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
        )}
      </div>

      {/* 하단 액션 버튼 */}
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
